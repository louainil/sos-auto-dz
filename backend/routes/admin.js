import express from 'express';
import { param, body, query } from 'express-validator';
import User from '../models/User.js';
import ServiceProvider from '../models/ServiceProvider.js';
import Booking from '../models/Booking.js';
import Review from '../models/Review.js';
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
    const [totalUsers, totalProviders, pendingProviders, totalBookings, totalReviews, bannedUsers] = await Promise.all([
      User.countDocuments({ role: { $ne: 'ADMIN' } }),
      ServiceProvider.countDocuments({ isVerified: 'APPROVED' }),
      ServiceProvider.countDocuments({ isVerified: 'PENDING' }),
      Booking.countDocuments(),
      Review.countDocuments(),
      User.countDocuments({ isBanned: true }),
    ]);
    res.json({ totalUsers, totalProviders, pendingProviders, totalBookings, totalReviews, bannedUsers });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', ...devError(error) });
  }
});

// @route   GET /api/admin/providers/pending
// @desc    Get providers awaiting verification
// @access  Private (Admin)
// FIXED: Added pagination (page/limit query params) — the old hard-coded limit(50) silently dropped
// data whenever more than 50 providers were pending. Now consistent with all other admin list routes.
router.get('/providers/pending', protect, isAdmin, [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  validate
], async (req, res) => {
  try {
    const page  = parseInt(req.query.page)  || 1;
    const limit = Math.min(parseInt(req.query.limit) || 50, 100);
    const skip  = (page - 1) * limit;
    const [providers, total] = await Promise.all([
      ServiceProvider.find({ isVerified: 'PENDING' })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      ServiceProvider.countDocuments({ isVerified: 'PENDING' }),
    ]);
    res.json({ data: providers, total, page, pages: Math.ceil(total / limit) });
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
    // FIXED: Added required 'title' field — Notification schema requires it; missing it caused a Mongoose
    // validation error that made the approve endpoint return 500 after the provider was already saved.
    await Notification.create({
      userId: provider.userId,
      title: 'Profile Approved',
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
    // FIXED: Added required 'title' field — same as approve endpoint, missing title caused 500.
    await Notification.create({
      userId: provider.userId,
      title: 'Profile Rejected',
      message: `Your provider profile has been rejected. Reason: ${rejectionReason}`,
      type: 'SYSTEM'
    });
    res.json(provider);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', ...devError(error) });
  }
});

// @route   GET /api/admin/users
// @desc    List all non-admin users (paginated + search)
// @access  Private (Admin)
router.get('/users', protect, isAdmin, [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('search').optional().isString().trim(),
  validate
], async (req, res) => {
  try {
    const page  = parseInt(req.query.page)  || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip  = (page - 1) * limit;
    const search = req.query.search?.trim();
    const filter = { role: { $ne: 'ADMIN' } };
    if (search) {
      filter.$or = [
        { name:  { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }
    const [users, total] = await Promise.all([
      User.find(filter)
        .select('name email role phone isBanned isEmailVerified createdAt')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      User.countDocuments(filter),
    ]);
    res.json({ data: users, total, page, pages: Math.ceil(total / limit) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', ...devError(error) });
  }
});

// @route   GET /api/admin/providers
// @desc    List all providers (optional status filter, paginated)
// @access  Private (Admin)
router.get('/providers', protect, isAdmin, [
  query('status').optional().isIn(['PENDING', 'APPROVED', 'REJECTED', 'ALL']),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  validate
], async (req, res) => {
  try {
    const page   = parseInt(req.query.page)  || 1;
    const limit  = parseInt(req.query.limit) || 20;
    const skip   = (page - 1) * limit;
    const status = req.query.status;
    const filter = (status && status !== 'ALL') ? { isVerified: status } : {};
    const [providers, total] = await Promise.all([
      ServiceProvider.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      ServiceProvider.countDocuments(filter),
    ]);
    res.json({ data: providers, total, page, pages: Math.ceil(total / limit) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', ...devError(error) });
  }
});

// @route   GET /api/admin/bookings
// @desc    Get all platform bookings (paginated, sorted newest first)
// @access  Private (Admin)
router.get('/bookings', protect, isAdmin, [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('status').optional().isString(),
  validate
], async (req, res) => {
  try {
    const page   = parseInt(req.query.page)  || 1;
    const limit  = parseInt(req.query.limit) || 20;
    const skip   = (page - 1) * limit;
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    const [bookings, total] = await Promise.all([
      Booking.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Booking.countDocuments(filter),
    ]);
    res.json({ data: bookings, total, page, pages: Math.ceil(total / limit) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', ...devError(error) });
  }
});

// @route   PUT /api/admin/users/:id/ban
// @desc    Ban or unban a user
// @access  Private (Admin)
router.put('/users/:id/ban', protect, isAdmin, [
  param('id').isMongoId().withMessage('Valid user ID is required'),
  body('isBanned').isBoolean().withMessage('isBanned must be a boolean'),
  validate
], async (req, res) => {
  try {
    const { isBanned } = req.body;
    // Prevent admin from banning themselves
    if (req.user._id.toString() === req.params.id) {
      return res.status(400).json({ message: 'You cannot ban your own account.' });
    }
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isBanned },
      { new: true, select: 'name email role isBanned' }
    );
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    // Notify the user
    // FIXED: Added required 'title' field — missing title caused Mongoose validation failure and 500.
    await Notification.create({
      userId: req.params.id,
      title: isBanned ? 'Account Suspended' : 'Account Reinstated',
      message: isBanned
        ? 'Your account has been suspended by an administrator.'
        : 'Your account suspension has been lifted.',
      type: 'SYSTEM'
    });
    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', ...devError(error) });
  }
});

export default router;
