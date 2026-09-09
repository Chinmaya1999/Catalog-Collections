const mongoose = require('mongoose');

const variantSchema = new mongoose.Schema({
  sku: { type: String, default: null },
  description: { type: String, default: null },
  dimensionsCm: { type: String, default: null },
  weightKg: { type: Number, default: null },
  volumeLtr: { type: Number, default: null },
  mrp: { type: Number, default: null },
  sellingPrice: { type: Number, default: null },
  heroImage: { type: String, default: null }
}, { _id: true });

const colorSchema = new mongoose.Schema({
  name: { type: String, default: null },
  code: { type: String, default: null },
  thumbnailImage: { type: String, default: null }
}, { _id: true });

const imageSchema = new mongoose.Schema({
  path: { type: String, required: true },
  width: { type: Number, default: null },
  height: { type: Number, default: null },
  isPrimary: { type: Boolean, default: false },
  source: { type: String, enum: ['embedded', 'render-crop'], default: 'embedded' }
}, { _id: true });

const productSchema = new mongoose.Schema({
  name: { type: String, default: null },
  brand: { type: String, default: null },
  material: { type: String, default: null },
  description: { type: String, default: null },
  badges: { type: [String], default: [] },
  variants: { type: [variantSchema], default: [] },
  colors: { type: [colorSchema], default: [] },
  images: { type: [imageSchema], default: [] },
  attributes: { type: mongoose.Schema.Types.Mixed, default: {} },
  source: {
    jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'ExtractionJob' },
    pageNumber: { type: Number },
    pageImage: { type: String },
    rawAiJson: { type: mongoose.Schema.Types.Mixed },
    confidence: { type: Number, default: null }
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  possibleDuplicateOf: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    default: null
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

productSchema.index({ status: 1 });
productSchema.index({ 'source.jobId': 1 });
productSchema.index({ 'variants.sku': 1 });

productSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Product', productSchema);
