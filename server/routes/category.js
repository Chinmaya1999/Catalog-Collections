const express = require('express');
const { body, validationResult } = require('express-validator');
const Category = require('../models/Category');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

// Get all categories (public)
router.get('/', async (req, res) => {
  try {
    const categories = await Category.find().sort({ order: 1, name: 1 });
    res.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ message: 'Error fetching categories' });
  }
});

// Get single category by ID (public)
router.get('/:id', async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }
    res.json(category);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching category' });
  }
});

// Create new category (admin only)
router.post('/', auth, [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('slug').trim().notEmpty().withMessage('Slug is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const categoryData = {
      name: req.body.name,
      slug: req.body.slug.toLowerCase(),
      icon: req.body.icon || '📁',
      order: req.body.order || 0,
      featured: req.body.featured || false
    };

    const category = new Category(categoryData);
    await category.save();

    res.status(201).json({
      message: 'Category created successfully',
      category
    });
  } catch (error) {
    console.error('Error creating category:', error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Category with this name or slug already exists' });
    }
    res.status(500).json({ message: 'Error creating category' });
  }
});

// Update category (admin only)
router.put('/:id', auth, async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    const updateData = {
      name: req.body.name || category.name,
      slug: req.body.slug ? req.body.slug.toLowerCase() : category.slug,
      icon: req.body.icon || category.icon,
      order: req.body.order || category.order,
      featured: req.body.featured !== undefined ? req.body.featured : category.featured
    };

    const updatedCategory = await Category.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    res.json({
      message: 'Category updated successfully',
      category: updatedCategory
    });
  } catch (error) {
    console.error('Error updating category:', error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Category with this name or slug already exists' });
    }
    res.status(500).json({ message: 'Error updating category' });
  }
});

// Delete category (admin only)
router.delete('/:id', auth, async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    await Category.findByIdAndDelete(req.params.id);

    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ message: 'Error deleting category' });
  }
});

module.exports = router;
