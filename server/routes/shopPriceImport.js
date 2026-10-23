const express = require('express');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const auth = require('../middleware/auth');
const Product = require('../models/Product');
const Category = require('../models/Category');
const { ShopPriceImportFile, ShopPriceImportItem } = require('../models/ShopPriceImport');
const { parseShopPriceImportPdf } = require('../services/shopPriceImportParser');
const { OUR_PRICE_HIKE_PERCENT, ourPriceFor } = require('../services/shopPriceImportPricing');

const router = express.Router();
const IMPORT_DIR = path.join(__dirname, '../uploads/shop-price-lists');

fs.mkdirSync(IMPORT_DIR, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: IMPORT_DIR,
    filename: (req, file, cb) =>
      cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}.pdf`)
  }),
  limits: { fileSize: 25 * 1024 * 1024 },
  fileFilter: (req, file, cb) =>
    /\.pdf$/i.test(file.originalname)
      ? cb(null, true)
      : cb(new Error('Only PDF files can be uploaded'))
});

const superadminOnly = (req, res, next) => {
  if (req.admin?.role !== 'superadmin') {
    return res.status(403).json({ message: 'Superadmin access is required' });
  }
  return next();
};

const normalizeModel = (value) => String(value || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const primaryImage = (product) => (product.images?.find((image) => image.isPrimary) || product.images?.[0])?.path || '';
const generateSkuCode = () => `AC-${crypto.randomBytes(5).toString('hex').toUpperCase()}`;

const createUniqueSkuCode = async (reservedCodes = new Set()) => {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const skuCode = generateSkuCode();
    if (reservedCodes.has(skuCode)) continue;
    const [productExists, importItemExists] = await Promise.all([
      Product.exists({ 'variants.sku': skuCode }),
      ShopPriceImportItem.exists({ skuCode })
    ]);
    if (!productExists && !importItemExists) {
      reservedCodes.add(skuCode);
      return skuCode;
    }
  }
  throw new Error('Could not generate a unique product SKU');
};

const categoryForType = async (name) => {
  const categoryName = String(name || '').trim() || 'Uncategorized';
  let category = await Category.findOne({ name: categoryName });
  if (category) return category;

  const baseSlug = categoryName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'category';
  try {
    category = await Category.create({
      name: categoryName,
      slug: `${baseSlug}-${crypto.randomBytes(3).toString('hex')}`,
      icon: '📦'
    });
    return category;
  } catch (error) {
    if (error.code !== 11000) throw error;
    category = await Category.findOne({ name: categoryName });
    if (!category) throw error;
    return category;
  }
};

router.get('/files', auth, superadminOnly, async (req, res) => {
  try {
    const files = await ShopPriceImportFile.find()
      .select('originalName itemCount createdAt isLive liveAt publishedProductIds')
      .sort({ createdAt: -1 })
      .lean();
    res.json({ files });
  } catch (error) {
    console.error('Error fetching imported Shop Price List files:', error);
    res.status(500).json({ message: 'Could not load imported price list files' });
  }
});

router.get('/items', auth, superadminOnly, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 50));
    const search = String(req.query.search || '').trim();
    const filter = {};
    if (search) {
      const escapedSearch = escapeRegex(search);
      filter.$or = [
        { itemType: { $regex: escapedSearch, $options: 'i' } },
        { modelName: { $regex: escapedSearch, $options: 'i' } },
        { hsnCode: { $regex: escapedSearch, $options: 'i' } }
      ];
    }

    const [items, total] = await Promise.all([
      ShopPriceImportItem.find(filter)
        .populate('sourceFile', 'originalName')
        .sort({ createdAt: -1, _id: 1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      ShopPriceImportItem.countDocuments(filter)
    ]);

    const modelNames = [...new Set(items.map((item) => item.modelName).filter((name) => name.length >= 3))];
    const productFilter = modelNames.length
      ? {
          isPublished: true,
          $or: modelNames.map((name) => ({
            'variants.sku': { $regex: escapeRegex(name), $options: 'i' }
          }))
        }
      : { _id: null };
    const products = await Product.find(productFilter).select('variants.sku images').lean();
    const imageByModel = new Map();
    products.forEach((product) => {
      const image = primaryImage(product);
      if (!image) return;
      product.variants.forEach((variant) => {
        const sku = normalizeModel(variant.sku);
        if (!sku) return;
        imageByModel.set(sku, image);
        modelNames.forEach((name) => {
          const model = normalizeModel(name);
          if (model.length >= 4 && sku.endsWith(model) && !imageByModel.has(model)) {
            imageByModel.set(model, image);
          }
        });
      });
    });

    res.json({
      items: items.map((item) => ({
        ...item,
        skuCode: item.skuCode || '',
        picture: imageByModel.get(normalizeModel(item.modelName)) || item.picture || '',
        ourPrice: ourPriceFor(item.pdfPrice),
        sourceFileName: item.sourceFile?.originalName || ''
      })),
      total,
      page,
      pages: Math.max(1, Math.ceil(total / limit)),
      ourPriceHikePercent: OUR_PRICE_HIKE_PERCENT
    });
  } catch (error) {
    console.error('Error fetching imported shop price items:', error);
    res.status(500).json({ message: 'Could not load imported shop price items' });
  }
});

router.delete('/files/:id', auth, superadminOnly, async (req, res) => {
  try {
    if (!/^[a-f\d]{24}$/i.test(req.params.id)) {
      return res.status(400).json({ message: 'Invalid uploaded PDF ID' });
    }
    const file = await ShopPriceImportFile.findById(req.params.id);
    if (!file) return res.status(404).json({ message: 'Uploaded PDF not found' });
    if (!/^\d+-\d+\.pdf$/i.test(file.fileName) || path.basename(file.fileName) !== file.fileName) {
      console.error('Refusing to remove an unexpected Shop Price List file path:', file.fileName);
      return res.status(500).json({ message: 'Could not safely remove this uploaded PDF' });
    }

    const { deletedCount: deletedProducts } = await Product.deleteMany({
      'source.shopPriceImportFileId': file._id
    });
    const { deletedCount } = await ShopPriceImportItem.deleteMany({ sourceFile: file._id });
    await ShopPriceImportFile.findByIdAndDelete(file._id);
    const imageDirectory = path.join(IMPORT_DIR, 'images', path.parse(file.fileName).name);
    const cleanupErrors = await Promise.allSettled([
      fs.promises.rm(path.join(IMPORT_DIR, file.fileName), { force: true }),
      fs.promises.rm(imageDirectory, { recursive: true, force: true })
    ]);
    cleanupErrors.forEach((result) => {
      if (result.status === 'rejected') console.error('Could not clean up reverted Shop Price List upload:', result.reason);
    });

    return res.json({
      message: 'PDF import reverted',
      fileName: file.originalName,
      deletedItems: deletedCount,
      unpublishedProducts: deletedProducts
    });
  } catch (error) {
    console.error('Error reverting imported Shop Price List PDF:', error);
    return res.status(500).json({ message: 'Could not revert this PDF import' });
  }
});

router.post('/files/:id/publish', auth, superadminOnly, async (req, res) => {
  try {
    if (!/^[a-f\d]{24}$/i.test(req.params.id)) {
      return res.status(400).json({ message: 'Invalid uploaded PDF ID' });
    }
    const file = await ShopPriceImportFile.findById(req.params.id);
    if (!file) return res.status(404).json({ message: 'Uploaded PDF not found' });

    const items = await ShopPriceImportItem.find({ sourceFile: file._id }).sort({ _id: 1 });
    if (items.length === 0) return res.status(400).json({ message: 'This PDF has no imported products to publish' });

    const reservedCodes = new Set();
    const existingProducts = await Product.find({
      'source.shopPriceImportFileId': file._id
    }).select('source.shopPriceImportItemId');
    const publishedItemIds = new Set(
      existingProducts.map((product) => String(product.source.shopPriceImportItemId))
    );
    const categories = new Map();
    for (const item of items) {
      if (!item.skuCode) {
        item.skuCode = await createUniqueSkuCode(reservedCodes);
        await item.save();
      }
      if (publishedItemIds.has(String(item._id))) continue;

      const categoryName = String(item.itemType || '').trim() || 'Uncategorized';
      if (!categories.has(categoryName)) {
        categories.set(categoryName, await categoryForType(categoryName));
      }
      const category = categories.get(categoryName);
      const ourPrice = ourPriceFor(item.pdfPrice);
      const images = item.picture
        ? [{ path: item.picture, isPrimary: true, source: 'embedded' }]
        : [];
      await Product.create({
        name: item.modelName,
        brand: 'Adihuman',
        category: category._id,
        categoryName: category.name,
        categories: [category._id],
        categoryNames: [category.name],
        description: `HSN Code: ${item.hsnCode || 'Not specified'} · GST: ${item.gstPercent == null ? 'Not specified' : `${item.gstPercent}%`}`,
        variants: [{
          sku: item.skuCode,
          description: item.itemType || null,
          mrp: item.pdfPrice,
          sellingPrice: ourPrice,
          heroImage: item.picture || null
        }],
        images,
        attributes: { hsnCode: item.hsnCode, gstPercent: item.gstPercent },
        source: {
          shopPriceImportFileId: file._id,
          shopPriceImportItemId: item._id
        },
        supplierCost: item.pdfPrice,
        status: 'pending',
        isPublished: false
      });
    }

    const importedProducts = await Product.find({
      'source.shopPriceImportFileId': file._id
    }).select('_id');
    const productIds = importedProducts.map((product) => product._id);
    await Product.updateMany(
      { 'source.shopPriceImportFileId': file._id },
      { $set: { status: 'approved', isPublished: true, publishedAt: new Date() } }
    );

    file.publishedProductIds = productIds;
    file.isLive = true;
    file.liveAt = new Date();
    await file.save();

    return res.json({
      message: 'Products are live in the Shop',
      fileName: file.originalName,
      published: productIds.length
    });
  } catch (error) {
    console.error('Error publishing imported Shop Price List products:', error);
    return res.status(500).json({ message: 'Could not publish these products to the Shop' });
  }
});

router.post(
  '/upload',
  auth,
  superadminOnly,
  (req, res, next) => upload.single('file')(req, res, (error) => (
    error ? res.status(400).json({ message: error.message }) : next()
  )),
  async (req, res) => {
    if (!req.file) return res.status(400).json({ message: 'Choose a PDF file to upload' });

    let importFile;
    const imageDirectory = path.join(IMPORT_DIR, 'images', path.parse(req.file.filename).name);
    try {
      const { items, warnings } = await parseShopPriceImportPdf(
        req.file.path,
        imageDirectory,
        `/uploads/shop-price-lists/images/${path.parse(req.file.filename).name}`
      );
      if (items.length === 0) {
        fs.unlink(req.file.path, (error) => {
          if (error) console.error('Could not remove unreadable shop price PDF:', error);
        });
        return res.status(422).json({
          message: 'No product rows could be read. Use a text-based PDF with model, price, HSN and GST columns.'
        });
      }

      importFile = await ShopPriceImportFile.create({
        originalName: req.file.originalname,
        fileName: req.file.filename,
        filePath: `/uploads/shop-price-lists/${req.file.filename}`,
        itemCount: items.length,
        uploadedBy: req.admin.username || ''
      });

      const rows = [];
      const reservedCodes = new Set();
      for (const item of items) {
        rows.push({
          ...item,
          skuCode: await createUniqueSkuCode(reservedCodes),
          sourceFile: importFile._id
        });
      }
      await ShopPriceImportItem.insertMany(rows);

      return res.status(201).json({
        message: 'PDF imported successfully',
        fileName: importFile.originalName,
        imported: items.length,
        ourPriceHikePercent: OUR_PRICE_HIKE_PERCENT,
        warnings
      });
    } catch (error) {
      console.error('Error importing Shop Price List PDF:', error);
      if (importFile) {
        await ShopPriceImportItem.deleteMany({ sourceFile: importFile._id }).catch((cleanupError) => {
          console.error('Could not clean up failed Shop Price List import rows:', cleanupError);
        });
        await ShopPriceImportFile.findByIdAndDelete(importFile._id).catch((cleanupError) => {
          console.error('Could not clean up failed Shop Price List import file record:', cleanupError);
        });
      }
      fs.rm(imageDirectory, { recursive: true, force: true }, (cleanupError) => {
        if (cleanupError) console.error('Could not clean up extracted Shop Price List images:', cleanupError);
      });
      fs.unlink(req.file.path, (unlinkError) => {
        if (unlinkError) console.error('Could not remove failed Shop Price List PDF:', unlinkError);
      });
      return res.status(500).json({ message: 'Could not import this PDF' });
    }
  }
);

module.exports = router;
