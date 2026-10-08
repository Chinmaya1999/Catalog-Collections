const express = require('express');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const auth = require('../middleware/auth');
const multer = require('multer');
const { PriceListFile, PriceListItem } = require('../models/PriceList');
const { parsePriceListFile, normalizeSku, categoryFromFileName } = require('../services/priceListParser');
const { savePriceList, refreshFileCounts } = require('../services/priceListStore');
const { syncShopPrices, SHOP_MARKUP_PERCENT } = require('../services/shopPricing');

const router = express.Router();

const PRICE_LIST_DIR = path.join(__dirname, '../uploads/price-lists');
fs.mkdirSync(PRICE_LIST_DIR, { recursive: true });

// Accept by extension: browsers often send .xlsx as application/octet-stream.
const upload = multer({
  storage: multer.diskStorage({
    destination: PRICE_LIST_DIR,
    filename: (req, file, cb) =>
      cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname).toLowerCase()}`)
  }),
  limits: { fileSize: 25 * 1024 * 1024 },
  fileFilter: (req, file, cb) =>
    /\.(pdf|xlsx|xls)$/i.test(file.originalname)
      ? cb(null, true)
      : cb(new Error(`${file.originalname}: only PDF and Excel (.xlsx, .xls) files are allowed`))
});

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Search + filter SKU rows (admin & superadmin)
router.get('/items', auth, async (req, res) => {
  try {
    const { search = '', category = '', file = '', priced = '', min = '', max = '', sort = 'sku' } = req.query;
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(500, Math.max(1, parseInt(req.query.limit, 10) || 50));

    const match = {};
    const term = String(search).trim();
    const key = normalizeSku(term);
    if (term) {
      const or = [{ description: { $regex: escapeRegex(term), $options: 'i' } }];
      if (key) or.push({ skuKey: { $regex: escapeRegex(key) } });
      match.$or = or;
    }
    if (category) match.category = category;
    if (file && mongoose.isValidObjectId(file)) match.sourceFile = new mongoose.Types.ObjectId(file);
    if (priced === 'yes') match.priceValue = { $ne: null };
    if (priced === 'no') match.priceValue = null;
    if (min !== '' || max !== '') {
      match.priceValue = { ...(match.priceValue || {}), $ne: null };
      if (min !== '' && !Number.isNaN(Number(min))) match.priceValue.$gte = Number(min);
      if (max !== '' && !Number.isNaN(Number(max))) match.priceValue.$lte = Number(max);
    }

    const sortStage = {
      sku: { category: 1, sku: 1 },
      'price-asc': { priceValue: 1, sku: 1 },
      'price-desc': { priceValue: -1, sku: 1 },
      recent: { updatedAt: -1, sku: 1 }
    }[sort] || { category: 1, sku: 1 };

    const [result] = await PriceListItem.aggregate([
      { $match: match },
      // An exact SKU hit always comes first; the letter prefix is optional, so "k301" hits "HGS - K301".
      { $addFields: { exactMatch: key ? { $regexMatch: { input: '$skuKey', regex: `^[A-Z]*${key}$` } } : false } },
      {
        $facet: {
          items: [
            { $sort: { exactMatch: -1, ...sortStage } },
            { $skip: (page - 1) * limit },
            { $limit: limit },
            { $lookup: { from: 'pricelistfiles', localField: 'sourceFile', foreignField: '_id', as: 'file' } },
            { $addFields: { sourceFileName: { $arrayElemAt: ['$file.originalName', 0] } } },
            { $project: { file: 0 } }
          ],
          total: [{ $count: 'count' }]
        }
      }
    ]).collation({ locale: 'en', numericOrdering: true });

    const total = result.total[0]?.count || 0;
    res.json({ items: result.items, total, page, pages: Math.max(1, Math.ceil(total / limit)) });
  } catch (error) {
    console.error('Error fetching price list items:', error);
    res.status(500).json({ message: 'Error fetching price list' });
  }
});

// Categories + uploaded files, for the filter dropdowns
router.get('/meta', auth, async (req, res) => {
  try {
    const [categories, files, total] = await Promise.all([
      PriceListItem.aggregate([{ $group: { _id: '$category', count: { $sum: 1 } } }, { $sort: { _id: 1 } }]),
      PriceListFile.find().sort({ createdAt: -1 }),
      PriceListItem.countDocuments()
    ]);
    res.json({ categories: categories.map((c) => ({ name: c._id, count: c.count })), files, total, markupPercent: SHOP_MARKUP_PERCENT });
  } catch (error) {
    console.error('Error fetching price list meta:', error);
    res.status(500).json({ message: 'Error fetching price list info' });
  }
});

// Upload one or more PDF / Excel price lists
router.post(
  '/upload',
  auth,
  (req, res, next) =>
    upload.array('files', 30)(req, res, (err) => (err ? res.status(400).json({ message: err.message }) : next())),
  async (req, res) => {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'Please choose at least one PDF or Excel file' });
    }

    const categoryOverride = String(req.body.category || '').trim();
    const results = [];

    for (const file of req.files) {
      const ext = path.extname(file.originalname).toLowerCase();
      const fileType = ext === '.pdf' ? 'pdf' : 'excel';
      const category = (req.files.length === 1 && categoryOverride) || categoryFromFileName(file.originalname);

      try {
        const { items, warnings } = await parsePriceListFile(file.path, file.originalname);
        if (items.length === 0) {
          fs.unlink(file.path, () => {});
          results.push({ fileName: file.originalname, category, error: 'No SKU codes were found in this file' });
          continue;
        }

        results.push(
          await savePriceList({
            items,
            warnings,
            originalName: file.originalname,
            fileName: file.filename,
            fileType,
            category,
            uploadedBy: req.admin.username || ''
          })
        );
      } catch (error) {
        console.error(`Error parsing price list ${file.originalname}:`, error);
        fs.unlink(file.path, () => {});
        results.push({ fileName: file.originalname, category, error: 'Could not read this file' });
      }
    }

    const shop = await syncShopPrices().catch((e) => { console.error('Shop price sync failed:', e); return null; });
    res.status(201).json({ message: 'Upload processed', results, shop });
  }
);

// Fix a single row by hand (e.g. a price the PDF didn't carry)
router.put('/items/:id', auth, async (req, res) => {
  try {
    const update = { updatedAt: new Date() };
    if (req.body.price !== undefined) {
      const text = String(req.body.price).trim();
      const num = text.match(/\d[\d,]*(?:\.\d+)?/);
      update.price = text;
      update.priceValue = num ? Number(num[0].replace(/,/g, '')) : null;
      update.plusGst = /\+\s*g[sd]t/i.test(text);
    }
    if (req.body.description !== undefined) update.description = String(req.body.description).trim();

    const item = await PriceListItem.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!item) return res.status(404).json({ message: 'SKU not found' });
    if (item.priceValue !== null) await syncShopPrices([item.skuKey]).catch((e) => console.error('Shop price sync failed:', e));
    res.json({ message: 'Price updated', item });
  } catch (error) {
    console.error('Error updating price list item:', error);
    res.status(500).json({ message: 'Error updating price' });
  }
});

router.delete('/items/:id', auth, async (req, res) => {
  try {
    const item = await PriceListItem.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ message: 'SKU not found' });
    if (item.sourceFile) await refreshFileCounts([item.sourceFile]);
    res.json({ message: 'SKU deleted' });
  } catch (error) {
    console.error('Error deleting price list item:', error);
    res.status(500).json({ message: 'Error deleting SKU' });
  }
});

// Delete an uploaded file along with every SKU row it currently owns
router.delete('/files/:id', auth, async (req, res) => {
  try {
    const file = await PriceListFile.findById(req.params.id);
    if (!file) return res.status(404).json({ message: 'File not found' });

    const { deletedCount } = await PriceListItem.deleteMany({ sourceFile: file._id });
    await PriceListFile.findByIdAndDelete(file._id);
    fs.unlink(path.join(__dirname, '..', file.filePath), () => {});

    res.json({ message: 'Price list deleted', deletedItems: deletedCount });
  } catch (error) {
    console.error('Error deleting price list file:', error);
    res.status(500).json({ message: 'Error deleting price list' });
  }
});

// Re-apply every price-list price (+65%) to the matching shop products
router.post('/sync-shop', auth, async (req, res) => {
  try {
    res.json({ message: 'Shop prices updated', ...(await syncShopPrices()) });
  } catch (error) {
    console.error('Error syncing shop prices:', error);
    res.status(500).json({ message: 'Error updating shop prices' });
  }
});

module.exports = router;
