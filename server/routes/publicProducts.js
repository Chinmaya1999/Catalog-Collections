const express = require('express');
const Product = require('../models/Product');

const router = express.Router();

const PAGE_SIZE_DEFAULT = 24;
const PAGE_SIZE_MAX = 60;

// ==================== Public catalog (no auth - anyone can browse) ====================
// Only ever returns isPublished:true products. Unapproved/unpublished data never reaches
// this router regardless of what query params are passed.

router.get('/', async (req, res) => {
  try {
    const filter = { isPublished: true };

    if (req.query.search) {
      const q = req.query.search.trim();
      if (q) {
        const re = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
        filter.$or = [{ name: re }, { brand: re }, { material: re }, { description: re }];
      }
    }
    if (req.query.brand) filter.brand = req.query.brand;
    if (req.query.category) filter.category = req.query.category;
    if (req.query.minPrice || req.query.maxPrice) {
      filter.priceFrom = {};
      if (req.query.minPrice) filter.priceFrom.$gte = Number(req.query.minPrice);
      if (req.query.maxPrice) filter.priceFrom.$lte = Number(req.query.maxPrice);
    }
    if (req.query.color) {
      filter['colors.name'] = new RegExp(`^${req.query.color.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');
    }

    // _id as a tiebreaker keeps pagination stable across requests - without it, ties on the
    // primary field (e.g. many products sharing a publishedAt from the same bulk-publish, or
    // the same name) can make skip/limit return a document on two pages, or skip one entirely.
    const sortOptions = {
      price_asc: { priceFrom: 1, _id: 1 },
      price_desc: { priceFrom: -1, _id: 1 },
      name_asc: { name: 1, _id: 1 },
      newest: { publishedAt: -1, _id: 1 }
    };
    const sort = sortOptions[req.query.sort] || sortOptions.newest;

    const limit = Math.min(parseInt(req.query.limit, 10) || PAGE_SIZE_DEFAULT, PAGE_SIZE_MAX);
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);

    const [products, total, facets] = await Promise.all([
      Product.find(filter)
        .select('-source.rawAiJson -attributes')
        .sort(sort)
        .skip((page - 1) * limit)
        .limit(limit),
      Product.countDocuments(filter),
      Product.aggregate([
        { $match: { isPublished: true } },
        {
          $facet: {
            categories: [
              { $match: { category: { $ne: null } } },
              { $group: { _id: { id: '$category', name: '$categoryName' }, count: { $sum: 1 } } },
              { $sort: { '_id.name': 1 } }
            ],
            brands: [
              { $match: { brand: { $ne: null } } },
              { $group: { _id: '$brand', count: { $sum: 1 } } },
              { $sort: { _id: 1 } }
            ],
            colors: [
              { $unwind: '$colors' },
              { $match: { 'colors.name': { $ne: null } } },
              { $group: { _id: { $toUpper: '$colors.name' }, count: { $sum: 1 } } },
              { $sort: { _id: 1 } }
            ],
            priceRange: [
              { $match: { priceFrom: { $ne: null } } },
              { $group: { _id: null, min: { $min: '$priceFrom' }, max: { $max: '$priceFrom' } } }
            ]
          }
        }
      ])
    ]);

    const facetResult = facets[0] || { categories: [], brands: [], colors: [], priceRange: [] };

    res.json({
      products,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      filters: {
        categories: facetResult.categories.map(c => ({ id: c._id.id, name: c._id.name, count: c.count })),
        brands: facetResult.brands.map(b => ({ name: b._id, count: b.count })),
        colors: facetResult.colors.map(c => ({ name: c._id, count: c.count })),
        priceRange: facetResult.priceRange[0]
          ? { min: facetResult.priceRange[0].min, max: facetResult.priceRange[0].max }
          : { min: 0, max: 0 }
      }
    });
  } catch (error) {
    console.error('Error fetching public products:', error);
    res.status(500).json({ message: 'Error fetching products' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findOne({ _id: req.params.id, isPublished: true })
      .select('-source.rawAiJson -attributes');
    if (!product) return res.status(404).json({ message: 'Product not found' });

    const related = await Product.find({
      isPublished: true,
      _id: { $ne: product._id },
      $or: [{ category: product.category }, { brand: product.brand }, { material: product.material }]
    }).select('-source.rawAiJson -attributes').limit(4);

    res.json({ product, related });
  } catch (error) {
    console.error('Error fetching public product:', error);
    res.status(500).json({ message: 'Error fetching product' });
  }
});

module.exports = router;
