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
  // Legacy single-category fields, kept in sync with categories[0]/categoryNames[0]
  // for older code paths (e.g. vendor exports) that still read a single category.
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  },
  categoryName: {
    type: String
  },
  categories: {
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category' }],
    required: true,
    validate: {
      validator: (arr) => Array.isArray(arr) && arr.length > 0,
      message: 'At least one category is required'
    }
  },
  categoryNames: {
    type: [String],
    required: true,
    validate: {
      validator: (arr) => Array.isArray(arr) && arr.length > 0,
      message: 'At least one category is required'
    }
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
  priceRange: {
    minPrice: {
      type: Number,
      default: 0
    },
    maxPrice: {
      type: Number,
      default: 0
    },
    currency: {
      type: String,
      default: '₹'
    }
  },
  products: [{
    code: {
      type: String,
      required: true
    },
    name: {
      type: String,
      default: ''
    },
    page: {
      type: Number,
      required: true
    },
    price: {
      type: Number,
      default: 0
    }
  }],
  productCodePageMap: {
    type: Object,
    default: {}
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

// Backfill categories/categoryNames for documents saved before multi-category support existed
catalogSchema.post('init', function(doc) {
  if ((!doc.categories || doc.categories.length === 0) && doc.category) {
    doc.categories = [doc.category];
  }
  if ((!doc.categoryNames || doc.categoryNames.length === 0) && doc.categoryName) {
    doc.categoryNames = [doc.categoryName];
  }
});

// Update the updatedAt timestamp and keep legacy single-category fields in sync
catalogSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  if (Array.isArray(this.categories) && this.categories.length > 0) {
    this.category = this.categories[0];
    this.categoryName = this.categoryNames && this.categoryNames[0] ? this.categoryNames[0] : this.categoryName;
  }
  next();
});

module.exports = mongoose.model('Catalog', catalogSchema);
