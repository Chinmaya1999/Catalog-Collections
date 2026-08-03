const express = require('express');
const Catalog = require('../models/Catalog');
const Category = require('../models/Category');
const auth = require('../middleware/auth');

const router = express.Router();

// Get dashboard statistics (admin only)
router.get('/dashboard', auth, async (req, res) => {
  try {
    const totalCatalogs = await Catalog.countDocuments();
    const totalCategories = await Category.countDocuments();
    const featuredCatalogs = await Catalog.countDocuments({ featured: true });
    const newCatalogs = await Catalog.countDocuments({ new: true });

    const recentCatalogs = await Catalog.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('category', 'name');

    res.json({
      statistics: {
        totalCatalogs,
        totalCategories,
        featuredCatalogs,
        newCatalogs
      },
      recentCatalogs
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({ message: 'Error fetching dashboard data' });
  }
});

module.exports = router;
