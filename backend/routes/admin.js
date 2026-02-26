import express from 'express';
import { param } from 'express-validator';
import User from '../models/User.js';
import ServiceProvider from '../models/ServiceProvider.js';
import { protect, isAdmin } from '../middleware/auth.js';
import validate from '../middleware/validate.js';

const router = express.Router();

// @route   GET /api/admin/stats
// @desc    Get platform-wide counts for admin dashboard
// @access  Private (Admin)
router.get('/stats', protect, isAdmin, async (req, res) => {
  try {
    const [totalUsers, totalProviders, pendingProviders] = await Promise.all([
      User.countDocuments(),
      ServiceProvider.countDocuments({ isVerified: true }),
      ServiceProvider.countDocuments({ isVerified: false }),
    ]);
    res.json({ totalUsers, totalProviders, pendingProviders });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/admin/providers/pending
// @desc    Get providers awaiting verification
// @access  Private (Admin)
router.get('/providers/pending', protect, isAdmin, async (req, res) => {
  try {
    const providers = await ServiceProvider.find({ isVerified: false })
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(providers);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
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
      { isVerified: true },
      { new: true }
    );
    if (!provider) {
      return res.status(404).json({ message: 'Provider not found' });
    }
    res.json(provider);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;
