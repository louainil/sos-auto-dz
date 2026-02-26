import express from 'express';
import { body, param } from 'express-validator';
import Review from '../models/Review.js';
import Booking from '../models/Booking.js';
import ServiceProvider from '../models/ServiceProvider.js';
import { protect } from '../middleware/auth.js';
import validate from '../middleware/validate.js';

const router = express.Router();

// @route   POST /api/reviews
// @desc    Create a review for a completed booking
// @access  Private (client only)
router.post('/', protect, [
  body('bookingId').isMongoId().withMessage('Valid booking ID is required'),
  body('providerId').isMongoId().withMessage('Valid provider ID is required'),
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be an integer between 1 and 5'),
  body('comment').optional().trim().isLength({ max: 1000 }).withMessage('Comment must be at most 1000 characters'),
  validate
], async (req, res) => {
  try {
    const { bookingId, providerId, rating, comment } = req.body;

    // Verify the booking exists, belongs to this client, and is COMPLETED
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    if (booking.clientId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You can only review your own bookings' });
    }
    if (booking.status !== 'COMPLETED') {
      return res.status(400).json({ message: 'You can only review completed bookings' });
    }

    // Check if a review already exists for this booking
    const existingReview = await Review.findOne({ bookingId });
    if (existingReview) {
      return res.status(400).json({ message: 'You have already reviewed this booking' });
    }

    // Create the review
    const review = await Review.create({
      providerId,
      clientId: req.user._id,
      bookingId,
      clientName: req.user.name,
      rating: Math.round(rating),
      comment: comment?.trim() || ''
    });

    // Recalculate provider's average rating and totalReviews
    const stats = await Review.aggregate([
      { $match: { providerId: booking.providerId } },
      {
        $group: {
          _id: '$providerId',
          avgRating: { $avg: '$rating' },
          count: { $sum: 1 }
        }
      }
    ]);

    if (stats.length > 0) {
      await ServiceProvider.findByIdAndUpdate(booking.providerId, {
        rating: Math.round(stats[0].avgRating * 10) / 10, // 1 decimal place
        totalReviews: stats[0].count
      });
    }

    res.status(201).json({
      _id: review._id,
      providerId: review.providerId,
      clientId: review.clientId,
      bookingId: review.bookingId,
      clientName: review.clientName,
      rating: review.rating,
      comment: review.comment,
      createdAt: review.createdAt
    });
  } catch (error) {
    console.error('Create review error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'You have already reviewed this booking' });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/reviews/provider/:providerId
// @desc    Get all reviews for a provider
// @access  Public
router.get('/provider/:providerId', [
  param('providerId').isMongoId().withMessage('Valid provider ID is required'),
  validate
], async (req, res) => {
  try {
    const reviews = await Review.find({ providerId: req.params.providerId })
      .sort({ createdAt: -1 })
      .limit(50);

    res.json(reviews);
  } catch (error) {
    console.error('Fetch reviews error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/reviews/booking/:bookingId
// @desc    Check if a review exists for a booking
// @access  Private
router.get('/booking/:bookingId', protect, [
  param('bookingId').isMongoId().withMessage('Valid booking ID is required'),
  validate
], async (req, res) => {
  try {
    const review = await Review.findOne({ bookingId: req.params.bookingId });
    res.json({ reviewed: !!review, review: review || null });
  } catch (error) {
    console.error('Check review error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;
