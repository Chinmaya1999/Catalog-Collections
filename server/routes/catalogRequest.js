const express = require('express');
const { body, validationResult } = require('express-validator');
const CatalogRequest = require('../models/CatalogRequest');
const auth = require('../middleware/auth');

const router = express.Router();

const superadminOnly = (req, res, next) => {
  if (!req.admin || req.admin.role !== 'superadmin') {
    return res.status(403).json({ message: 'Superadmin access required' });
  }
  next();
};

// Create new catalog request (public)
router.post('/', [
  body('catalogCode').trim().notEmpty().withMessage('Catalog code is required'),
  body('catalogNumber').trim().notEmpty().withMessage('Catalog number is required'),
  body('phoneNumber').trim().notEmpty().withMessage('Phone number is required')
    .matches(/^[0-9]{10,15}$/).withMessage('Phone number must be 10-15 digits')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const catalogRequestData = {
      catalogCode: req.body.catalogCode,
      catalogNumber: req.body.catalogNumber,
      phoneNumber: req.body.phoneNumber,
      status: 'pending'
    };

    const catalogRequest = new CatalogRequest(catalogRequestData);
    await catalogRequest.save();

    res.status(201).json({
      message: 'Catalog request submitted successfully',
      catalogRequest
    });
  } catch (error) {
    console.error('Error creating catalog request:', error);
    res.status(500).json({ message: 'Error creating catalog request' });
  }
});

// Get all active (non-deleted) catalog requests (admin only)
router.get('/', auth, async (req, res) => {
  try {
    const catalogRequests = await CatalogRequest.find({ isDeleted: { $ne: true } }).sort({ createdAt: -1 });
    res.json(catalogRequests);
  } catch (error) {
    console.error('Error fetching catalog requests:', error);
    res.status(500).json({ message: 'Error fetching catalog requests' });
  }
});

// Get every catalog request, including deleted ones (superadmin only)
router.get('/all', auth, superadminOnly, async (req, res) => {
  try {
    const catalogRequests = await CatalogRequest.find()
      .populate('deletedBy', 'username email')
      .sort({ createdAt: -1 });
    res.json(catalogRequests);
  } catch (error) {
    console.error('Error fetching all catalog requests:', error);
    res.status(500).json({ message: 'Error fetching all catalog requests' });
  }
});

// Get single catalog request by ID (admin only)
router.get('/:id', auth, async (req, res) => {
  try {
    const catalogRequest = await CatalogRequest.findById(req.params.id);
    if (!catalogRequest) {
      return res.status(404).json({ message: 'Catalog request not found' });
    }
    res.json(catalogRequest);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching catalog request' });
  }
});

// Update catalog request status (admin only)
router.put('/:id', auth, async (req, res) => {
  try {
    const catalogRequest = await CatalogRequest.findById(req.params.id);
    if (!catalogRequest) {
      return res.status(404).json({ message: 'Catalog request not found' });
    }

    const updateData = {
      status: req.body.status || catalogRequest.status,
      notes: req.body.notes !== undefined ? req.body.notes : catalogRequest.notes
    };

    const updatedCatalogRequest = await CatalogRequest.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    res.json({
      message: 'Catalog request updated successfully',
      catalogRequest: updatedCatalogRequest
    });
  } catch (error) {
    console.error('Error updating catalog request:', error);
    res.status(500).json({ message: 'Error updating catalog request' });
  }
});

// Delete catalog request (admin only)
// This is a soft delete — the request is hidden from the admin's list but the
// full record (requester phone number, catalog code/number, notes, etc.) is
// kept and remains visible to superadmins in the Super Admin dashboard.
router.delete('/:id', auth, async (req, res) => {
  try {
    const catalogRequest = await CatalogRequest.findById(req.params.id);
    if (!catalogRequest) {
      return res.status(404).json({ message: 'Catalog request not found' });
    }

    catalogRequest.isDeleted = true;
    catalogRequest.deletedAt = new Date();
    catalogRequest.deletedBy = req.admin._id;
    await catalogRequest.save();

    res.json({ message: 'Catalog request deleted successfully' });
  } catch (error) {
    console.error('Error deleting catalog request:', error);
    res.status(500).json({ message: 'Error deleting catalog request' });
  }
});

module.exports = router;