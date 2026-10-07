const mongoose = require('mongoose');

const vendorSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  phone: {
    type: String,
    default: '',
    trim: true
  },
  address: {
    type: String,
    default: '',
    trim: true
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      required: false
    },
    coordinates: {
      type: [Number],
      required: false
    }
  },
  googleMapsLink: {
    type: String,
    trim: true
  },
  locationPincode: {
    type: String,
    trim: true
  },
  city: {
    type: String,
    required: true,
    trim: true
  },
  state: {
    type: String,
    required: true,
    trim: true
  },
  pincode: {
    type: String,
    default: '',
    trim: true
  },
  catalogId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Catalog',
    required: true
  },
  productCode: {
    type: String,
    default: '',
    trim: true
  },
  productCodes: {
    type: [String],
    default: [],
    required: false
  },
  // 0 = not quoted yet ("price on enquiry"), e.g. vendors found via web research.
  price: {
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
  transportCharges: {
    type: Number,
    default: 0
  },
  distance: {
    type: Number,
    default: 0
  },
  // Web-research leads: where the details came from, and whether someone has confirmed them.
  source: { type: String, default: '', trim: true },
  notes: { type: String, default: '', trim: true },
  verified: { type: Boolean, default: true },
  active: {
    type: Boolean,
    default: true
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

// Update the updatedAt timestamp before saving
vendorSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Create index for location-based queries
vendorSchema.index({ location: '2dsphere' });
vendorSchema.index({ productCode: 1 });
vendorSchema.index({ catalogId: 1 });

module.exports = mongoose.model('Vendor', vendorSchema);