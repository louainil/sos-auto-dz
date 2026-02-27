import express from 'express';
import { body, param } from 'express-validator';
import Booking from '../models/Booking.js';
import ServiceProvider from '../models/ServiceProvider.js';
import Notification from '../models/Notification.js';
import { protect } from '../middleware/auth.js';
import validate from '../middleware/validate.js';
import { emitNotification } from '../config/socket.js';

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

    res.status(201).json(booking);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/bookings
// @desc    Get bookings (filtered by user role)
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    let bookings;
    
    if (req.user.role === 'CLIENT') {
      // Get bookings made by this client
      bookings = await Booking.find({ clientId: req.user._id }).sort({ createdAt: -1 });
    } else if (['MECHANIC', 'PARTS_SHOP', 'TOWING'].includes(req.user.role)) {
      // Get provider profile
      const provider = await ServiceProvider.findOne({ userId: req.user._id });
      if (provider) {
        bookings = await Booking.find({ providerId: provider._id }).sort({ createdAt: -1 });
      } else {
        bookings = [];
      }
    } else {
      // Admin can see all bookings
      bookings = await Booking.find().sort({ createdAt: -1 });
    }

    res.json(bookings);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
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
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/bookings/:id
// @desc    Update booking status
// @access  Private
router.put('/:id', protect, [
  param('id').isMongoId().withMessage('Valid booking ID is required'),
  body('status').optional().isIn(['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED']).withMessage('Status must be PENDING, CONFIRMED, COMPLETED, or CANCELLED'),
  body('price').optional().isFloat({ min: 0 }).withMessage('Price must be a non-negative number'),
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

    const { status, price } = req.body;

    if (status) booking.status = status;
    if (price !== undefined) booking.price = price;

    const updatedBooking = await booking.save();

    // Create notification for the other party
    const notificationUserId = isProvider ? booking.clientId : provider.userId;
    const statusNotif = await Notification.create({
      userId: notificationUserId,
      title: 'Booking Updated',
      message: `Booking status changed to ${status}`,
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

    res.json(updatedBooking);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   DELETE /api/bookings/:id
// @desc    Delete/Cancel booking
// @access  Private
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
      return res.status(403).json({ message: 'Not authorized to delete this booking' });
    }

    await booking.deleteOne();
    res.json({ message: 'Booking removed' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;
