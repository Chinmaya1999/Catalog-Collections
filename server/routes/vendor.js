const express = require('express');
const router = express.Router();
const Vendor = require('../models/Vendor');
const Catalog = require('../models/Catalog');
const authMiddleware = require('../middleware/auth');

// Get all vendors for a catalog
router.get('/catalog/:catalogId', authMiddleware, async (req, res) => {
  try {
    const { catalogId } = req.params;
    const vendors = await Vendor.find({ catalogId, active: true })
      .sort({ createdAt: -1 });
    res.json(vendors);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching vendors', error: error.message });
  }
});

// Get all vendors
router.get('/catalog/all', authMiddleware, async (req, res) => {
  try {
    const vendors = await Vendor.find({ active: true })
      .populate('catalogId', 'name categoryName')
      .sort({ createdAt: -1 });
    res.json(vendors);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching vendors', error: error.message });
  }
});

// Get vendor by product code (public - no auth required)
router.get('/product/:productCode', async (req, res) => {
  try {
    const { productCode } = req.params;
    const { latitude, longitude } = req.query;
    
    let vendors = await Vendor.find({ productCode, active: true })
      .populate('catalogId', 'name categoryName pdfFile');
    
    // Calculate distances if location is provided
    if (latitude && longitude) {
      const adminLocation = {
        type: 'Point',
        coordinates: [parseFloat(longitude), parseFloat(latitude)]
      };
      
      vendors = vendors.map(vendor => {
        // Only calculate distance if vendor has valid coordinates
        if (vendor.location.coordinates[0] !== 0 && vendor.location.coordinates[1] !== 0) {
          const distance = calculateDistance(
            adminLocation.coordinates[1],
            adminLocation.coordinates[0],
            vendor.location.coordinates[1],
            vendor.location.coordinates[0]
          );
          return {
            ...vendor.toObject(),
            distance: distance
          };
        }
        return {
          ...vendor.toObject(),
          distance: null
        };
      });
      
      // Sort by distance (put vendors with distance first, then those without)
      vendors.sort((a, b) => {
        if (a.distance === null && b.distance === null) return 0;
        if (a.distance === null) return 1;
        if (b.distance === null) return -1;
        return a.distance - b.distance;
      });
    }
    
    res.json(vendors);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching vendors by product code', error: error.message });
  }
});

// Get all unique product codes from vendors (public)
router.get('/product-codes', async (req, res) => {
  try {
    const productCodes = await Vendor.distinct('productCode', { active: true });
    res.json(productCodes);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching product codes', error: error.message });
  }
});

// Create new vendor (admin only)
router.post('/', authMiddleware, async (req, res) => {
  try {
    const {
      name,
      phone,
      address,
      location,
      googleMapsLink,
      locationPincode,
      city,
      state,
      pincode,
      catalogId,
      productCode,
      price,
      transportCharges
    } = req.body;

    // Validate catalog exists
    const catalog = await Catalog.findById(catalogId);
    if (!catalog) {
      return res.status(404).json({ message: 'Catalog not found' });
    }

    // Set default location if not provided
    const vendorLocation = location || { type: 'Point', coordinates: [0, 0] };

    const vendor = new Vendor({
      name,
      phone,
      address,
      location: vendorLocation,
      googleMapsLink,
      locationPincode,
      city,
      state,
      pincode,
      catalogId,
      productCode,
      price,
      transportCharges
    });

    await vendor.save();
    res.status(201).json(vendor);
  } catch (error) {
    res.status(500).json({ message: 'Error creating vendor', error: error.message });
  }
});

// Update vendor
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const {
      name,
      phone,
      address,
      location,
      googleMapsLink,
      locationPincode,
      city,
      state,
      pincode,
      productCode,
      price,
      transportCharges,
      active
    } = req.body;

    const vendor = await Vendor.findByIdAndUpdate(
      req.params.id,
      {
        name,
        phone,
        address,
        location,
        googleMapsLink,
        locationPincode,
        city,
        state,
        pincode,
        productCode,
        price,
        transportCharges,
        active
      },
      { new: true }
    );

    if (!vendor) {
      return res.status(404).json({ message: 'Vendor not found' });
    }

    res.json(vendor);
  } catch (error) {
    res.status(500).json({ message: 'Error updating vendor', error: error.message });
  }
});

// Delete vendor
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const vendor = await Vendor.findByIdAndDelete(req.params.id);
    if (!vendor) {
      return res.status(404).json({ message: 'Vendor not found' });
    }
    res.json({ message: 'Vendor deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting vendor', error: error.message });
  }
});

// Bulk create vendors for a catalog
router.post('/bulk', authMiddleware, async (req, res) => {
  try {
    const { vendors } = req.body;
    
    if (!Array.isArray(vendors) || vendors.length === 0) {
      return res.status(400).json({ message: 'Invalid vendors data' });
    }

    // Validate all catalogs exist
    const catalogIds = [...new Set(vendors.map(v => v.catalogId))];
    const catalogs = await Catalog.find({ _id: { $in: catalogIds } });
    
    if (catalogs.length !== catalogIds.length) {
      return res.status(404).json({ message: 'One or more catalogs not found' });
    }

    const createdVendors = await Vendor.insertMany(vendors);
    res.status(201).json(createdVendors);
  } catch (error) {
    res.status(500).json({ message: 'Error creating vendors', error: error.message });
  }
});

// Calculate distance between two coordinates (Haversine formula)
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;
  return Math.round(distance * 100) / 100; // Round to 2 decimal places
}

module.exports = router;