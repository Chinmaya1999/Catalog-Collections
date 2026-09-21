const express = require('express');
const Product = require('../models/Product');
const Category = require('../models/Category');

const router = express.Router();

const PAGE_SIZE_DEFAULT = 24;
const PAGE_SIZE_MAX = 60;

// ==================== Public catalog (no auth - anyone can browse) ====================
// Only ever returns isPublished:true products. Unapproved/unpublished data never reaches
// this router regardless of what query params are passed.

router.get('/', async (req, res) => {
  try {
    // Lookup by explicit id list (used by the Shop page's wishlist) bypasses every other
    // filter/pagination concern - the caller already knows exactly which products it wants.
    if (req.query.ids) {
      const ids = req.query.ids.split(',').map((id) => id.trim()).filter(Boolean);
      const products = await Product.find({ _id: { $in: ids }, isPublished: true })
        .select('-source.rawAiJson -attributes');
      return res.json({
        products,
        pagination: { page: 1, limit: products.length, total: products.length, totalPages: 1 },
        filters: { categories: [], brands: [], colors: [], priceRange: { min: 0, max: 0 } }
      });
    }

    const filter = { isPublished: true };

    if (req.query.search) {
      const q = req.query.search.trim();
      if (q) {
        const re = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
        // Broadened so a search matches on category/color too (e.g. typing "storage" or
        // "navy blue" surfaces relevant products even when the term isn't in the name).
        filter.$or = [
          { name: re }, { brand: re }, { material: re }, { description: re }, { 'variants.sku': re },
          { categoryName: re }, { categoryNames: re }, { 'colors.name': re }
        ];
      }
    }
    if (req.query.brand) filter.brand = req.query.brand;
    // Match either the legacy singular field (older published products) or the new
    // multi-category array, so a product tagged under several categories shows up when
    // browsing any one of them.
    if (req.query.category) {
      filter.$and = [{ $or: [{ category: req.query.category }, { categories: req.query.category }] }];
    }
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

    const [products, total, facets, categoryDocs] = await Promise.all([
      Product.find(filter)
        .select('-source.rawAiJson -attributes')
        .sort(sort)
        .skip((page - 1) * limit)
        .limit(limit),
      Product.countDocuments(filter),
      Product.aggregate([
        { $match: { isPublished: true } },
        // Normalize into a single categoryPairs array so products still on the legacy
        // singular field (published before multi-category support) are counted the same
        // way as products with a `categories` array.
        {
          $addFields: {
            categoryPairs: {
              $cond: [
                { $gt: [{ $size: { $ifNull: ['$categories', []] } }, 0] },
                { $zip: { inputs: [{ $ifNull: ['$categories', []] }, { $ifNull: ['$categoryNames', []] }] } },
                { $cond: [{ $ne: ['$category', null] }, [['$category', '$categoryName']], []] }
              ]
            }
          }
        },
        {
          $facet: {
            categories: [
              { $unwind: '$categoryPairs' },
              { $group: { _id: { id: { $arrayElemAt: ['$categoryPairs', 0] }, name: { $arrayElemAt: ['$categoryPairs', 1] } }, count: { $sum: 1 } } },
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
              { $group: { _id: { $toUpper: { $trim: { input: '$colors.name' } } }, count: { $sum: 1 } } },
              { $match: { _id: { $ne: '' } } },
              { $sort: { _id: 1 } }
            ],
            priceRange: [
              { $match: { priceFrom: { $ne: null } } },
              { $group: { _id: null, min: { $min: '$priceFrom' }, max: { $max: '$priceFrom' } } }
            ]
          }
        }
      ]),
      // Fetched unconditionally (not filtered by the facet's own category set) so every
      // category card can show its icon even before any product-side filter narrows things.
      Category.find().select('icon name')
    ]);

    const facetResult = facets[0] || { categories: [], brands: [], colors: [], priceRange: [] };
    const iconById = new Map(categoryDocs.map((c) => [String(c._id), c.icon]));

    res.json({
      products,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      filters: {
        categories: facetResult.categories.map(c => ({
          id: c._id.id,
          name: c._id.name,
          count: c.count,
          icon: iconById.get(String(c._id.id)) || '📦'
        })),
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
      .select('-source.rawAiJson -attributes')
      .populate('vendorCatalogId', 'name pdfFile');
    if (!product) return res.status(404).json({ message: 'Product not found' });

    const productCategoryIds = product.categories && product.categories.length > 0
      ? product.categories
      : [product.category].filter(Boolean);
    const baseFilter = { isPublished: true, _id: { $ne: product._id } };

    // Same-category matches first (most relevant), then top up with brand/material matches only
    // if needed. Querying everything in one $or with no relevance ordering let unrelated products
    // crowd out same-category ones whenever brand/material happened to be null on both sides -
    // `{ material: null }` matches every other product with no material set, which is most of the
    // catalog, so a null-material product could get "related" results with nothing in common.
    let related = [];
    if (productCategoryIds.length > 0) {
      related = await Product.find({
        ...baseFilter,
        $or: [{ category: { $in: productCategoryIds } }, { categories: { $in: productCategoryIds } }]
      }).select('-source.rawAiJson -attributes').limit(4);
    }

    if (related.length < 4) {
      const fallbackOr = [];
      if (product.brand) fallbackOr.push({ brand: product.brand });
      if (product.material) fallbackOr.push({ material: product.material });

      if (fallbackOr.length > 0) {
        const excludeIds = [product._id, ...related.map((r) => r._id)];
        const fallback = await Product.find({
          ...baseFilter,
          _id: { $nin: excludeIds },
          $or: fallbackOr
        }).select('-source.rawAiJson -attributes').limit(4 - related.length);
        related = related.concat(fallback);
      }
    }

    res.json({ product, related });
  } catch (error) {
    console.error('Error fetching public product:', error);
    res.status(500).json({ message: 'Error fetching product' });
  }
});

// Paginated version of the "related products" section on the product detail page, so the
// (fixed 4-item) `related` array embedded above can be replaced with an infinite-scroll grid
// without re-fetching the product itself on every page. Relevance is expressed as a numeric
// score (same-category matches outrank same-brand/material-only matches) computed in the
// aggregation itself, so paging through results doesn't reshuffle or duplicate items the way
// running two separate tiered queries page-by-page would.
router.get('/:id/related', async (req, res) => {
  try {
    const product = await Product.findOne({ _id: req.params.id, isPublished: true })
      .select('categories category brand material');
    if (!product) return res.status(404).json({ message: 'Product not found' });

    const productCategoryIds = product.categories && product.categories.length > 0
      ? product.categories
      : [product.category].filter(Boolean);

    // Strictly same-category when the product has one - "You may also like" on a t-shirt should
    // page through other t-shirts, not drift into unrelated same-brand products from a totally
    // different category once the category matches run out. Brand/material is a fallback only
    // for the rare product with no category assigned at all.
    const limit = Math.min(parseInt(req.query.limit, 10) || 12, 40);
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);

    let matchOr;
    if (productCategoryIds.length > 0) {
      matchOr = [{ category: { $in: productCategoryIds } }, { categories: { $in: productCategoryIds } }];
    } else {
      matchOr = [];
      if (product.brand) matchOr.push({ brand: product.brand });
      if (product.material) matchOr.push({ material: product.material });
    }

    if (matchOr.length === 0) {
      return res.json({ products: [], pagination: { page, limit, total: 0, totalPages: 0 } });
    }

    const baseMatch = { isPublished: true, _id: { $ne: product._id }, $or: matchOr };

    const [products, total] = await Promise.all([
      Product.find(baseMatch)
        .select('-source.rawAiJson -attributes')
        .sort({ publishedAt: -1, _id: 1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Product.countDocuments(baseMatch)
    ]);

    res.json({ products, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (error) {
    console.error('Error fetching related products:', error);
    res.status(500).json({ message: 'Error fetching related products' });
  }
});

module.exports = router;
