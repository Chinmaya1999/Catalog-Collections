const mongoose = require('mongoose');

const pdfDocumentSchema = new mongoose.Schema({
  fileName: {
    type: String,
    required: true
  },
  originalName: {
    type: String,
    required: true
  },
  filePath: {
    type: String,
    required: true
  },
  fileSize: {
    type: Number,
    default: 0
  },
  totalPages: {
    type: Number,
    default: 0
  },
  detectedType: {
    type: String,
    enum: ['price-list', 'vendor-list', 'catalog', 'invoice', 'unknown'],
    default: 'unknown'
  },
  confidence: {
    type: Number,
    default: 0
  },
  columns: {
    type: [String],
    default: []
  },
  extractedRows: {
    type: [mongoose.Schema.Types.Mixed],
    default: []
  },
  rowCount: {
    type: Number,
    default: 0
  },
  rawTextPreview: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['completed', 'failed'],
    default: 'completed'
  },
  errorMessage: {
    type: String,
    default: ''
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

pdfDocumentSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('PdfDocument', pdfDocumentSchema);
