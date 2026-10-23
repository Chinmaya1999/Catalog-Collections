const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const auth = require('../middleware/auth');
const Product = require('../models/Product');
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

router.get('/files', auth, superadminOnly, async (req, res) => {
  try {
    const files = await ShopPriceImportFile.find()
      .select('originalName itemCount createdAt')
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
      deletedItems: deletedCount
    });
  } catch (error) {
    console.error('Error reverting imported Shop Price List PDF:', error);
    return res.status(500).json({ message: 'Could not revert this PDF import' });
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

      await ShopPriceImportItem.insertMany(items.map((item) => ({
        ...item,
        sourceFile: importFile._id
      })));

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
