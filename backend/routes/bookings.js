import express from 'express';
import { body, param } from 'express-validator';
import Booking from '../models/Booking.js';
import User from '../models/User.js';
import ServiceProvider from '../models/ServiceProvider.js';
import Notification from '../models/Notification.js';
import { protect } from '../middleware/auth.js';
import validate from '../middleware/validate.js';
import { emitNotification } from '../config/socket.js';
import { sendNewBookingEmail, sendBookingStatusEmail } from '../config/email.js';
import { devError } from '../utils/errors.js';

const router = express.Router();

// @route   POST /api/bookings
// @desc    Create a new booking
// @access  Private
router.post('/', protect, [
  body('providerId').isMongoId().withMessage('Valid provider ID is required'),
  body('date').isISO8601().withMessage('Valid date is required (ISO 8601)'),
  body('issue').trim().notEmpty().withMessage('Issue description is required')
    .isLength({ max: 2000 }).withMessage('Issue must be at most 2000 characters'),
  validate
], async (req, res) => {
  try {
    const { providerId, date, issue } = req.body;

    // Reject bookings in the past
    const bookingDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (bookingDate < today) {
      return res.status(400).json({ message: 'Cannot book a date in the past' });
    }

    const provider = await ServiceProvider.findById(providerId);
    if (!provider) {
      return res.status(404).json({ message: 'Provider not found' });
    }

    const booking = await Booking.create({
      providerId,
      providerName: provider.name,
      providerPhone: provider.phone || '',
      clientId: req.user._id,
      clientName: req.user.name,
      clientPhone: req.user.phone || '',
      date: new Date(date),
      issue,
      status: 'PENDING'
    });

    // Create notification for provider
    const notif = await Notification.create({
      userId: provider.userId,
      title: 'New Booking Request',
      message: `${req.user.name} has requested a booking for ${date}`,
      type: 'INFO'
    });

    // Emit real-time notification via Socket.io
    emitNotification(provider.userId, {
      _id: notif._id,
      title: notif.title,
      message: notif.message,
      type: notif.type,
      isRead: notif.isRead,
      createdAt: notif.createdAt
    });

    // Send email notification to provider (fire-and-forget)
    const providerUser = await User.findById(provider.userId).select('email');
    if (providerUser?.email) {
      sendNewBookingEmail({
        providerEmail: providerUser.email,
        providerName: provider.name,
        clientName: req.user.name,
        date,
        issue,
      });
    }

    res.status(201).json(booking);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', ...devError(error) });
  }
});

// @route   GET /api/bookings
// @desc    Get bookings (filtered by user role, paginated)
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const skip = (page - 1) * limit;

    let filter;
    if (req.user.role === 'CLIENT') {
      filter = { clientId: req.user._id };
    } else if (['MECHANIC', 'PARTS_SHOP', 'TOWING'].includes(req.user.role)) {
      const provider = await ServiceProvider.findOne({ userId: req.user._id });
      if (!provider) {
        return res.json({ data: [], total: 0, page, pages: 0 });
      }
      filter = { providerId: provider._id };
    } else {
      // Admin can see all bookings
      filter = {};
    }

    const [total, bookings] = await Promise.all([
      Booking.countDocuments(filter),
      Booking.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit)
    ]);

    res.json({ data: bookings, total, page, pages: Math.ceil(total / limit) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', ...devError(error) });
  }
});

// @route   GET /api/bookings/:id
// @desc    Get single booking
// @access  Private
router.get('/:id', protect, [
  param('id').isMongoId().withMessage('Valid booking ID is required'),
  validate
], async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Check if user is authorized to view this booking
    const provider = await ServiceProvider.findById(booking.providerId);
    const isClient = booking.clientId.toString() === req.user._id.toString();
    const isProvider = provider && provider.userId.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'ADMIN';

    if (!isClient && !isProvider && !isAdmin) {
      return res.status(403).json({ message: 'Not authorized to view this booking' });
    }

    res.json(booking);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', ...devError(error) });
  }
});

// @route   PUT /api/bookings/:id
// @desc    Update booking status
// @access  Private
router.put('/:id', protect, [
  param('id').isMongoId().withMessage('Valid booking ID is required'),
  body('status').optional().isIn(['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED']).withMessage('Status must be PENDING, CONFIRMED, COMPLETED, or CANCELLED'),
  body('price').optional().isFloat({ min: 0 }).withMessage('Price must be a non-negative number'),
  body('cancellationReason').optional().trim().isLength({ max: 500 }).withMessage('Cancellation reason must be at most 500 characters'),
  validate
], async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Check authorization
    const provider = await ServiceProvider.findById(booking.providerId);
    const isClient = booking.clientId.toString() === req.user._id.toString();
    const isProvider = provider && provider.userId.toString() === req.user._id.toString();

    if (!isClient && !isProvider) {
      return res.status(403).json({ message: 'Not authorized to update this booking' });
    }

    const { status, price, cancellationReason } = req.body;

    if (status) booking.status = status;
    if (price !== undefined) booking.price = price;
    if (status === 'CANCELLED' && cancellationReason) booking.cancellationReason = cancellationReason;

    const updatedBooking = await booking.save();

    // Only notify / email when status was actually changed
    if (status) {
      const notificationUserId = isProvider ? booking.clientId : provider.userId;
      const statusNotif = await Notification.create({
        userId: notificationUserId,
        title: 'Booking Updated',
        message: `Booking status changed to ${status}${status === 'CANCELLED' && cancellationReason ? ': ' + cancellationReason : ''}`,
        type: 'INFO'
      });

      // Emit real-time notification via Socket.io
      emitNotification(notificationUserId, {
        _id: statusNotif._id,
        title: statusNotif.title,
        message: statusNotif.message,
        type: statusNotif.type,
        isRead: statusNotif.isRead,
        createdAt: statusNotif.createdAt
      });

      // Send email notification for status change (fire-and-forget)
      if (status !== 'PENDING') {
        const recipientUser = await User.findById(notificationUserId).select('email name');
        if (recipientUser?.email) {
          sendBookingStatusEmail({
            recipientEmail: recipientUser.email,
            recipientName: recipientUser.name,
            otherPartyName: isProvider ? booking.clientName : booking.providerName,
            status,
            date: booking.date,
          });
        }
      }
    }

    res.json(updatedBooking);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', ...devError(error) });
  }
});

// @route   DELETE /api/bookings/:id
// @desc    Cancel booking (soft delete — sets status to CANCELLED, preserves history)
// @access  Private (client who owns the booking)
router.delete('/:id', protect, [
  param('id').isMongoId().withMessage('Valid booking ID is required'),
  validate
], async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Check if user owns this booking
    if (booking.clientId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to cancel this booking' });
    }

    // Cannot cancel a booking that is already completed or cancelled
    if (booking.status === 'COMPLETED' || booking.status === 'CANCELLED') {
      return res.status(400).json({ message: `Cannot cancel a booking with status: ${booking.status}` });
    }

    booking.status = 'CANCELLED';
    const { cancellationReason } = req.body;
    if (cancellationReason) booking.cancellationReason = cancellationReason;
    await booking.save();

    res.json({ message: 'Booking cancelled', booking });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', ...devError(error) });
  }
});

export default router;
