const mongoose = require('mongoose');

const extractionJobSchema = new mongoose.Schema({
  originalName: {
    type: String,
    required: true
  },
  fileName: {
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
  status: {
    type: String,
    enum: ['uploaded', 'processing', 'completed', 'failed', 'cancelled'],
    default: 'uploaded'
  },
  currentPage: {
    type: Number,
    default: 0
  },
  processedPages: {
    type: Number,
    default: 0
  },
  productsFound: {
    type: Number,
    default: 0
  },
  imagesFound: {
    type: Number,
    default: 0
  },
  skippedPages: {
    type: [Number],
    default: []
  },
  failedPages: {
    type: [{
      page: Number,
      error: String
    }],
    default: []
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

extractionJobSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('ExtractionJob', extractionJobSchema);
