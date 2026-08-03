const express = require('express');
const { body, validationResult } = require('express-validator');
const Catalog = require('../models/Catalog');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

// Get all catalogs (public)
router.get('/', async (req, res) => {
  try {
    const catalogs = await Catalog.find().sort({ order: 1, createdAt: -1 });
    res.json(catalogs);
  } catch (error) {
    console.error('Error fetching catalogs:', error);
    res.status(500).json({ message: 'Error fetching catalogs' });
  }
});

// Get single catalog by ID (public)
router.get('/:id', async (req, res) => {
  try {
    const catalog = await Catalog.findById(req.params.id);
    if (!catalog) {
      return res.status(404).json({ message: 'Catalog not found' });
    }
    res.json(catalog);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching catalog' });
  }
});

// Create new catalog (admin only)
router.post('/', auth, [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('description').trim().notEmpty().withMessage('Description is required'),
  body('category').notEmpty().withMessage('Category is required'),
  body('categoryName').trim().notEmpty().withMessage('Category name is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const catalogData = {
      name: req.body.name,
      description: req.body.description,
      category: req.body.category,
      categoryName: req.body.categoryName,
      driveLink: req.body.driveLink || '',
      pdfFile: req.body.pdfFile || '',
      image: req.body.image,
      type: req.body.type || 'product',
      comboCount: req.body.comboCount || 0,
      featured: req.body.featured || false,
      new: req.body.new || false,
      ecoFriendly: req.body.ecoFriendly || false,
      order: req.body.order || 0,
      products: req.body.products ? JSON.parse(req.body.products) : []
    };

    const catalog = new Catalog(catalogData);
    await catalog.save();

    res.status(201).json({
      message: 'Catalog created successfully',
      catalog
    });
  } catch (error) {
    console.error('Error creating catalog:', error);
    res.status(500).json({ message: 'Error creating catalog' });
  }
});

// Update catalog (admin only)
router.put('/:id', auth, async (req, res) => {
  try {
    const catalog = await Catalog.findById(req.params.id);
    if (!catalog) {
      return res.status(404).json({ message: 'Catalog not found' });
    }

    const updateData = {
      name: req.body.name || catalog.name,
      description: req.body.description || catalog.description,
      category: req.body.category || catalog.category,
      categoryName: req.body.categoryName || catalog.categoryName,
      driveLink: req.body.driveLink !== undefined ? req.body.driveLink : catalog.driveLink,
      pdfFile: req.body.pdfFile !== undefined ? req.body.pdfFile : catalog.pdfFile,
      image: req.body.image || catalog.image,
      type: req.body.type || catalog.type,
      comboCount: req.body.comboCount || catalog.comboCount,
      featured: req.body.featured !== undefined ? req.body.featured : catalog.featured,
      new: req.body.new !== undefined ? req.body.new : catalog.new,
      ecoFriendly: req.body.ecoFriendly !== undefined ? req.body.ecoFriendly : catalog.ecoFriendly,
      order: req.body.order || catalog.order,
      products: req.body.products ? JSON.parse(req.body.products) : catalog.products
    };

    const updatedCatalog = await Catalog.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    res.json({
      message: 'Catalog updated successfully',
      catalog: updatedCatalog
    });
  } catch (error) {
    console.error('Error updating catalog:', error);
    res.status(500).json({ message: 'Error updating catalog' });
  }
});

// Delete catalog (admin only)
router.delete('/:id', auth, async (req, res) => {
  try {
    const catalog = await Catalog.findById(req.params.id);
    if (!catalog) {
      return res.status(404).json({ message: 'Catalog not found' });
    }

    await Catalog.findByIdAndDelete(req.params.id);

    res.json({ message: 'Catalog deleted successfully' });
  } catch (error) {
    console.error('Error deleting catalog:', error);
    res.status(500).json({ message: 'Error deleting catalog' });
  }
});

// Upload catalog image (admin only)
router.post('/image', auth, upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    res.json({
      message: 'Image uploaded successfully',
      imagePath: `/uploads/catalogs/${req.file.filename}`
    });
  } catch (error) {
    console.error('Error uploading image:', error);
    res.status(500).json({ message: 'Error uploading image' });
  }
});

// Upload catalog PDF (admin only)
router.post('/pdf', auth, upload.single('pdf'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    res.json({
      message: 'PDF uploaded successfully',
      pdfPath: `/uploads/pdfs/${req.file.filename}`
    });
  } catch (error) {
    console.error('Error uploading PDF:', error);
    res.status(500).json({ message: 'Error uploading PDF' });
  }
});

module.exports = router;
