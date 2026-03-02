import express from 'express';
import { param } from 'express-validator';
import Notification from '../models/Notification.js';
import { protect } from '../middleware/auth.js';
import validate from '../middleware/validate.js';
import { devError } from '../utils/errors.js';

const router = express.Router();

// @route   GET /api/notifications
// @desc    Get notifications for current user (paginated)
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 50);
    const skip = (page - 1) * limit;

    const [total, notifications] = await Promise.all([
      Notification.countDocuments({ userId: req.user._id }),
      Notification.find({ userId: req.user._id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
    ]);

    res.json({ data: notifications, total, page, pages: Math.ceil(total / limit) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', ...devError(error) });
  }
});

// @route   PUT /api/notifications/:id/read
// @desc    Mark notification as read
// @access  Private
router.put('/:id/read', protect, [
  param('id').isMongoId().withMessage('Valid notification ID is required'),
  validate
], async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    // Check if notification belongs to user
    if (notification.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    notification.isRead = true;
    await notification.save();

    res.json(notification);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', ...devError(error) });
  }
});

// @route   DELETE /api/notifications
// @desc    Clear all notifications for current user
// @access  Private
router.delete('/', protect, async (req, res) => {
  try {
    await Notification.deleteMany({ userId: req.user._id });
    res.json({ message: 'All notifications cleared' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', ...devError(error) });
  }
});

// @route   DELETE /api/notifications/:id
// @desc    Delete single notification
// @access  Private
router.delete('/:id', protect, [
  param('id').isMongoId().withMessage('Valid notification ID is required'),
  validate
], async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    // Check if notification belongs to user
    if (notification.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await notification.deleteOne();
    res.json({ message: 'Notification removed' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', ...devError(error) });
  }
});

export default router;
