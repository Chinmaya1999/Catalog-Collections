const express = require('express');
const router = express.Router();
const Vendor = require('../models/Vendor');
const Catalog = require('../models/Catalog');
const authMiddleware = require('../middleware/auth');

// Get all vendors
router.get('/catalog/all', authMiddleware, async (req, res) => {
  try {
    const vendors = await Vendor.find({ active: true })
      .populate('catalogId', 'name categoryName priceRange')
      .sort({ createdAt: -1 });
    res.json(vendors);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching vendors', error: error.message });
  }
});

// Get all vendors for a catalog
router.get('/catalog/:catalogId', authMiddleware, async (req, res) => {
  try {
    const { catalogId } = req.params;
    const vendors = await Vendor.find({ catalogId, active: true })
      .populate('catalogId', 'name categoryName priceRange')
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
    
    console.log('Vendor search request:', { productCode, latitude, longitude });
    
    // Search in both productCode (single) and productCodes (array) fields
    let vendors = await Vendor.find({ 
      $or: [
        { productCode: productCode },
        { productCodes: productCode }
      ],
      active: true 
    })
      .populate('catalogId', 'name categoryName pdfFile priceRange');
    
    console.log(`Found ${vendors.length} vendors for product code ${productCode}`);
    
    // Calculate distances if location is provided
    if (latitude && longitude) {
      const adminLocation = {
        type: 'Point',
        coordinates: [parseFloat(longitude), parseFloat(latitude)]
      };
      
      console.log('Admin location:', adminLocation);
      
      vendors = vendors.map(vendor => {
        console.log(`Vendor ${vendor.name} location:`, vendor.location);
        
        // Only calculate distance if vendor has valid coordinates (not 0,0)
        if (vendor.location && vendor.location.coordinates && 
            vendor.location.coordinates[0] !== 0 && vendor.location.coordinates[1] !== 0) {
          const distance = calculateDistance(
            adminLocation.coordinates[1],
            adminLocation.coordinates[0],
            vendor.location.coordinates[1],
            vendor.location.coordinates[0]
          );
          console.log(`Distance to ${vendor.name}: ${distance} km`);
          return {
            ...vendor.toObject(),
            distance: distance
          };
        }
        console.log(`Vendor ${vendor.name} has invalid coordinates, skipping distance calculation`);
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
    console.error('Error fetching vendors by product code:', error);
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

// Multi-field vendor search (public)
router.get('/search', async (req, res) => {
  try {
    const { productCode, vendorName, location, phoneNumber, latitude, longitude } = req.query;
    
    console.log('Multi-field vendor search:', { productCode, vendorName, location, phoneNumber, latitude, longitude });
    
    // Build search query
    const searchQuery = { active: true };
    
    if (productCode) {
      searchQuery.$or = [
        { productCode: { $regex: productCode, $options: 'i' } },
        { productCodes: { $regex: productCode, $options: 'i' } }
      ];
    }
    
    if (vendorName) {
      searchQuery.name = { $regex: vendorName, $options: 'i' };
    }
    
    if (location) {
      searchQuery.$or = searchQuery.$or || [];
      searchQuery.$or.push(
        { city: { $regex: location, $options: 'i' } },
        { state: { $regex: location, $options: 'i' } },
        { pincode: { $regex: location, $options: 'i' } },
        { address: { $regex: location, $options: 'i' } }
      );
    }
    
    if (phoneNumber) {
      searchQuery.phone = { $regex: phoneNumber, $options: 'i' };
    }
    
    let vendors = await Vendor.find(searchQuery)
      .populate('catalogId', 'name categoryName pdfFile priceRange');
    
    console.log(`Found ${vendors.length} vendors matching search criteria`);
    
    // Calculate distances if location is provided
    if (latitude && longitude) {
      const adminLocation = {
        type: 'Point',
        coordinates: [parseFloat(longitude), parseFloat(latitude)]
      };
      
      vendors = vendors.map(vendor => {
        if (vendor.location && vendor.location.coordinates && 
            vendor.location.coordinates[0] !== 0 && vendor.location.coordinates[1] !== 0) {
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
      
      // Sort by distance
      vendors.sort((a, b) => {
        if (a.distance === null && b.distance === null) return 0;
        if (a.distance === null) return 1;
        if (b.distance === null) return -1;
        return a.distance - b.distance;
      });
    }
    
    res.json(vendors);
  } catch (error) {
    console.error('Error in multi-field vendor search:', error);
    res.status(500).json({ message: 'Error searching vendors', error: error.message });
  }
});

// Create new vendor (admin only)
router.post('/', authMiddleware, async (req, res) => {
  try {
    console.log('Creating vendor with data:', req.body);
    
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
      productCodes,
      price,
      minPrice,
      maxPrice,
      currency,
      transportCharges
    } = req.body;

    // Validate required fields
    if (!name || !phone || !address || !city || !state || !pincode || !catalogId || !price) {
      return res.status(400).json({ 
        message: 'Missing required fields',
        missing: {
          name: !name,
          phone: !phone,
          address: !address,
          city: !city,
          state: !state,
          pincode: !pincode,
          catalogId: !catalogId,
          price: !price
        }
      });
    }

    // Ensure at least one product code is available
    const finalProductCodes = productCodes && productCodes.length > 0 ? productCodes : [productCode];
    const finalProductCode = productCode || (productCodes && productCodes.length > 0 ? productCodes[0] : '');
    
    if (!finalProductCode) {
      return res.status(400).json({ 
        message: 'At least one product code is required'
      });
    }

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
      productCode: finalProductCode,
      productCodes: finalProductCodes,
      price,
      priceRange: {
        minPrice: minPrice || price,
        maxPrice: maxPrice || price,
        currency: currency || '₹'
      },
      transportCharges
    });

    await vendor.save();
    console.log('Vendor created successfully:', vendor);
    res.status(201).json(vendor);
  } catch (error) {
    console.error('Error creating vendor:', error);
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
      productCodes,
      price,
      minPrice,
      maxPrice,
      currency,
      transportCharges,
      active
    } = req.body;

    // Use productCodes array if provided, otherwise use single productCode
    const finalProductCodes = productCodes && productCodes.length > 0 ? productCodes : [productCode];
    const finalProductCode = productCode || (productCodes && productCodes.length > 0 ? productCodes[0] : '');

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
        productCode: finalProductCode,
        productCodes: finalProductCodes,
        price,
        priceRange: {
          minPrice: minPrice !== undefined ? minPrice : price,
          maxPrice: maxPrice !== undefined ? maxPrice : price,
          currency: currency || '₹'
        },
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

// Delete all vendors
router.delete('/all/delete', authMiddleware, async (req, res) => {
  try {
    const result = await Vendor.deleteMany({});
    res.json({ message: `Deleted ${result.deletedCount} vendors successfully` });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting all vendors', error: error.message });
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