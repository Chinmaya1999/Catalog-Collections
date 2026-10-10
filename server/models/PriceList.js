const mongoose = require('mongoose');

// One uploaded price list file (PDF or Excel).
const priceListFileSchema = new mongoose.Schema({
  originalName: { type: String, required: true, trim: true },
  fileName: { type: String, required: true },
  filePath: { type: String, required: true },
  fileType: { type: String, enum: ['pdf', 'excel'], required: true },
  category: { type: String, required: true, trim: true },
  itemCount: { type: Number, default: 0 },
  warnings: [{ type: String }],
  uploadedBy: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

// One SKU row extracted from a price list file. A SKU code lives in exactly one
// row — uploading a newer list with the same code replaces the older price.
const priceListItemSchema = new mongoose.Schema({
  sku: { type: String, required: true, trim: true },
  skuKey: { type: String, required: true, unique: true, index: true },
  price: { type: String, default: '' },
  priceValue: { type: Number, default: null },
  plusGst: { type: Boolean, default: false },
  // Hand-set Shop price. When present it replaces the automatic list price + markup.
  shopPrice: { type: Number, default: null },
  description: { type: String, default: '' },
  category: { type: String, required: true, index: true },
  section: { type: String, default: '' },
  sourceFile: { type: mongoose.Schema.Types.ObjectId, ref: 'PriceListFile', index: true },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = {
  PriceListFile: mongoose.model('PriceListFile', priceListFileSchema),
  PriceListItem: mongoose.model('PriceListItem', priceListItemSchema)
};
