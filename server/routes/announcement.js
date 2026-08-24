const express = require('express');
const { body, validationResult } = require('express-validator');
const Announcement = require('../models/Announcement');
const auth = require('../middleware/auth');

const router = express.Router();

// Get the currently live announcement (public)
router.get('/active', async (req, res) => {
  try {
    const now = new Date();
    const announcement = await Announcement.findOne({
      isActive: true,
      $and: [
        { $or: [{ startDate: null }, { startDate: { $lte: now } }] },
        { $or: [{ endDate: null }, { endDate: { $gte: now } }] }
      ]
    }).sort({ updatedAt: -1 });

    res.json(announcement || null);
  } catch (error) {
    console.error('Error fetching active announcement:', error);
    res.status(500).json({ message: 'Error fetching active announcement' });
  }
});

// Get all announcements (admin only)
router.get('/', auth, async (req, res) => {
  try {
    const announcements = await Announcement.find().sort({ createdAt: -1 });
    res.json(announcements);
  } catch (error) {
    console.error('Error fetching announcements:', error);
    res.status(500).json({ message: 'Error fetching announcements' });
  }
});

// Create announcement (admin only)
router.post('/', auth, [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('message').trim().notEmpty().withMessage('Message is required'),
  body('discountPercent').optional().isFloat({ min: 0, max: 100 }).withMessage('Discount must be between 0 and 100')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const announcementData = {
      title: req.body.title,
      message: req.body.message,
      discountPercent: req.body.discountPercent || 0,
      theme: req.body.theme || 'confetti',
      ctaText: req.body.ctaText || 'Shop Now',
      ctaLink: req.body.ctaLink || '/catalog',
      isActive: !!req.body.isActive,
      startDate: req.body.startDate || null,
      endDate: req.body.endDate || null
    };

    // Only one announcement can be live to users at a time
    if (announcementData.isActive) {
      await Announcement.updateMany({}, { isActive: false });
    }

    const announcement = new Announcement(announcementData);
    await announcement.save();

    res.status(201).json({
      message: 'Announcement created successfully',
      announcement
    });
  } catch (error) {
    console.error('Error creating announcement:', error);
    res.status(500).json({ message: 'Error creating announcement' });
  }
});

// Update announcement (admin only)
router.put('/:id', auth, async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id);
    if (!announcement) {
      return res.status(404).json({ message: 'Announcement not found' });
    }

    const willBeActive = req.body.isActive !== undefined ? !!req.body.isActive : announcement.isActive;

    // Only one announcement can be live to users at a time
    if (willBeActive) {
      await Announcement.updateMany({ _id: { $ne: req.params.id } }, { isActive: false });
    }

    const updateData = {
      title: req.body.title ?? announcement.title,
      message: req.body.message ?? announcement.message,
      discountPercent: req.body.discountPercent ?? announcement.discountPercent,
      theme: req.body.theme ?? announcement.theme,
      ctaText: req.body.ctaText ?? announcement.ctaText,
      ctaLink: req.body.ctaLink ?? announcement.ctaLink,
      isActive: willBeActive,
      startDate: req.body.startDate !== undefined ? req.body.startDate : announcement.startDate,
      endDate: req.body.endDate !== undefined ? req.body.endDate : announcement.endDate,
      updatedAt: Date.now()
    };

    const updatedAnnouncement = await Announcement.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    res.json({
      message: 'Announcement updated successfully',
      announcement: updatedAnnouncement
    });
  } catch (error) {
    console.error('Error updating announcement:', error);
    res.status(500).json({ message: 'Error updating announcement' });
  }
});

// Delete announcement (admin only)
router.delete('/:id', auth, async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id);
    if (!announcement) {
      return res.status(404).json({ message: 'Announcement not found' });
    }

    await Announcement.findByIdAndDelete(req.params.id);

    res.json({ message: 'Announcement deleted successfully' });
  } catch (error) {
    console.error('Error deleting announcement:', error);
    res.status(500).json({ message: 'Error deleting announcement' });
  }
});

module.exports = router;
