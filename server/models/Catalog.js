const mongoose = require('mongoose');

const catalogSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  },
  categoryName: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['combo', 'product', 'eco-friendly'],
    default: 'product'
  },
  comboCount: {
    type: Number,
    default: 0
  },
  image: {
    type: String,
    required: false
  },
  driveLink: {
    type: String,
    required: false
  },
  pdfFile: {
    type: String,
    required: false
  },
  featured: {
    type: Boolean,
    default: false
  },
  new: {
    type: Boolean,
    default: false
  },
  ecoFriendly: {
    type: Boolean,
    default: false
  },
  order: {
    type: Number,
    default: 0
  },
  products: [{
    code: String,
    name: String,
    page: Number
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt timestamp before saving
catalogSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Catalog', catalogSchema);
