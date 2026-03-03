import express from 'express';
import { param, body } from 'express-validator';
import User from '../models/User.js';
import ServiceProvider from '../models/ServiceProvider.js';
import Notification from '../models/Notification.js';
import { protect, isAdmin } from '../middleware/auth.js';
import validate from '../middleware/validate.js';
import { devError } from '../utils/errors.js';

const router = express.Router();

// @route   GET /api/admin/stats
// @desc    Get platform-wide counts for admin dashboard
// @access  Private (Admin)
router.get('/stats', protect, isAdmin, async (req, res) => {
  try {
    const [totalUsers, totalProviders, pendingProviders] = await Promise.all([
      User.countDocuments(),
      ServiceProvider.countDocuments({ isVerified: 'APPROVED' }),
      ServiceProvider.countDocuments({ isVerified: 'PENDING' }),
    ]);
    res.json({ totalUsers, totalProviders, pendingProviders });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', ...devError(error) });
  }
});

// @route   GET /api/admin/providers/pending
// @desc    Get providers awaiting verification
// @access  Private (Admin)
router.get('/providers/pending', protect, isAdmin, async (req, res) => {
  try {
    const providers = await ServiceProvider.find({ isVerified: 'PENDING' })
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(providers);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', ...devError(error) });
  }
});

// @route   PUT /api/admin/providers/:id/approve
// @desc    Approve (verify) a service provider
// @access  Private (Admin)
router.put('/providers/:id/approve', protect, isAdmin, [
  param('id').isMongoId().withMessage('Valid provider ID is required'),
  validate
], async (req, res) => {
  try {
    const provider = await ServiceProvider.findByIdAndUpdate(
      req.params.id,
      { isVerified: 'APPROVED', rejectionReason: '' },
      { new: true }
    );
    if (!provider) {
      return res.status(404).json({ message: 'Provider not found' });
    }
    // Notify the provider
    await Notification.create({
      userId: provider.userId,
      message: 'Your provider profile has been approved! You are now visible to clients.',
      type: 'SYSTEM'
    });
    res.json(provider);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', ...devError(error) });
  }
});

// @route   PUT /api/admin/providers/:id/reject
// @desc    Reject a service provider with a reason
// @access  Private (Admin)
router.put('/providers/:id/reject', protect, isAdmin, [
  param('id').isMongoId().withMessage('Valid provider ID is required'),
  body('rejectionReason').notEmpty().withMessage('Rejection reason is required').isLength({ max: 500 }),
  validate
], async (req, res) => {
  try {
    const { rejectionReason } = req.body;
    const provider = await ServiceProvider.findByIdAndUpdate(
      req.params.id,
      { isVerified: 'REJECTED', rejectionReason },
      { new: true }
    );
    if (!provider) {
      return res.status(404).json({ message: 'Provider not found' });
    }
    // Notify the provider
    await Notification.create({
      userId: provider.userId,
      message: `Your provider profile has been rejected. Reason: ${rejectionReason}`,
      type: 'SYSTEM'
    });
    res.json(provider);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', ...devError(error) });
  }
});

export default router;
