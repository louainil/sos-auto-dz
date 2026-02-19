import express from 'express';
import Booking from '../models/Booking.js';
import ServiceProvider from '../models/ServiceProvider.js';
import Notification from '../models/Notification.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// @route   POST /api/bookings
// @desc    Create a new booking
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const { providerId, date, issue } = req.body;

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
      date,
      issue,
      status: 'PENDING'
    });

    // Create notification for provider
    await Notification.create({
      userId: provider.userId,
      title: 'New Booking Request',
      message: `${req.user.name} has requested a booking for ${date}`,
      type: 'INFO'
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
router.get('/:id', protect, async (req, res) => {
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
router.put('/:id', protect, async (req, res) => {
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
    await Notification.create({
      userId: notificationUserId,
      title: 'Booking Updated',
      message: `Booking status changed to ${status}`,
      type: 'INFO'
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
router.delete('/:id', protect, async (req, res) => {
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
