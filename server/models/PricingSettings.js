const mongoose = require('mongoose');

// One document per superadmin: the "Costs & profit" settings on the Shop page (profit rules,
// add-on costs, GST/rounding, per-category and per-product overrides, PDF header details).
// Stored as one blob because the client owns its shape; the server never computes prices from it.
const pricingSettingsSchema = new mongoose.Schema({
  admin: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', required: true, unique: true },
  data: { type: mongoose.Schema.Types.Mixed, default: {} },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('PricingSettings', pricingSettingsSchema);
