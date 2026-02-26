import express from 'express';
import ServiceProvider from '../models/ServiceProvider.js';
import { protect, isProfessional } from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/providers
// @desc    Get all service providers with filters
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { role, wilayaId, commune, garageType, specialty, isAvailable } = req.query;

    // Build filter object
    const filter = {};
    
    if (role) filter.role = role;
    if (wilayaId) filter.wilayaId = parseInt(wilayaId);
    if (commune) filter.commune = commune;
    if (garageType) filter.garageType = garageType;
    if (specialty) filter.specialty = { $in: [specialty] };
    if (isAvailable !== undefined) filter.isAvailable = isAvailable === 'true';

    const providers = await ServiceProvider.find(filter).sort({ rating: -1 });
    
    res.json(providers);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/providers/stats
// @desc    Get public platform statistics for homepage
// @access  Public
router.get('/stats', async (req, res) => {
  try {
    const [totalProviders, wilayaIds, ratingResult] = await Promise.all([
      ServiceProvider.countDocuments({ isVerified: true }),
      ServiceProvider.distinct('wilayaId', { isVerified: true }),
      ServiceProvider.aggregate([
        { $match: { isVerified: true, totalReviews: { $gt: 0 } } },
        { $group: { _id: null, avgRating: { $avg: '$rating' } } }
      ])
    ]);

    res.json({
      totalProviders,
      wilayasCovered: wilayaIds.length,
      avgRating: ratingResult.length > 0 ? Math.round(ratingResult[0].avgRating * 10) / 10 : 0,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/providers/:id
// @desc    Get single service provider
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const provider = await ServiceProvider.findById(req.params.id).populate('userId', 'name email phone');
    
    if (!provider) {
      return res.status(404).json({ message: 'Provider not found' });
    }

    res.json(provider);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/providers/:id
// @desc    Update service provider
// @access  Private (Professional)
router.put('/:id', protect, isProfessional, async (req, res) => {
  try {
    const provider = await ServiceProvider.findById(req.params.id);

    if (!provider) {
      return res.status(404).json({ message: 'Provider not found' });
    }

    // Check if the user owns this provider profile
    if (provider.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this provider' });
    }

    const {
      name,
      description,
      phone,
      specialty,
      image,
      isAvailable,
      workingDays,
      workingHours
    } = req.body;

    // Update fields
    if (name) provider.name = name;
    if (description) provider.description = description;
    if (phone) provider.phone = phone;
    if (specialty) provider.specialty = specialty;
    if (image) provider.image = image;
    if (isAvailable !== undefined) provider.isAvailable = isAvailable;
    if (workingDays) provider.workingDays = workingDays;
    if (workingHours) provider.workingHours = workingHours;

    const updatedProvider = await provider.save();
    res.json(updatedProvider);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/providers/user/:userId
// @desc    Get provider profile by user ID
// @access  Private
router.get('/user/:userId', protect, async (req, res) => {
  try {
    const provider = await ServiceProvider.findOne({ userId: req.params.userId });
    
    if (!provider) {
      return res.status(404).json({ message: 'Provider profile not found' });
    }

    res.json(provider);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;
