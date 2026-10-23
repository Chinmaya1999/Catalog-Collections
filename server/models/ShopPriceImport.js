const mongoose = require('mongoose');

const shopPriceImportFileSchema = new mongoose.Schema({
  originalName: { type: String, required: true, trim: true },
  fileName: { type: String, required: true },
  filePath: { type: String, required: true },
  itemCount: { type: Number, default: 0 },
  uploadedBy: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

const shopPriceImportItemSchema = new mongoose.Schema({
  itemType: { type: String, default: '' },
  picture: { type: String, default: '' },
  modelName: { type: String, required: true, trim: true },
  pdfPrice: { type: Number, required: true, min: 0 },
  hsnCode: { type: String, default: '' },
  gstPercent: { type: Number, default: null },
  sourceFile: { type: mongoose.Schema.Types.ObjectId, ref: 'ShopPriceImportFile', required: true, index: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = {
  ShopPriceImportFile: mongoose.model('ShopPriceImportFile', shopPriceImportFileSchema),
  ShopPriceImportItem: mongoose.model('ShopPriceImportItem', shopPriceImportItemSchema)
};
