import express from 'express';
import { body, param, query } from 'express-validator';
import ServiceProvider from '../models/ServiceProvider.js';
import { protect, isProfessional } from '../middleware/auth.js';
import validate from '../middleware/validate.js';

const router = express.Router();

// @route   GET /api/providers
// @desc    Get all service providers with filters
// @access  Public
router.get('/', [
  query('role').optional().isIn(['MECHANIC', 'PARTS_SHOP', 'TOWING']).withMessage('Invalid role'),
  query('wilayaId').optional().isInt({ min: 1, max: 58 }).withMessage('Wilaya ID must be 1-58'),
  query('commune').optional().trim(),
  query('garageType').optional().trim(),
  query('specialty').optional().trim(),
  query('search').optional().trim().isLength({ max: 100 }).withMessage('Search query must be at most 100 characters'),
  query('isAvailable').optional().isIn(['true', 'false']).withMessage('isAvailable must be true or false'),
  validate
], async (req, res) => {
  try {
    const { role, wilayaId, commune, garageType, specialty, isAvailable, search } = req.query;

    // Build filter object
    const filter = {};
    
    if (role) filter.role = role;
    if (wilayaId) filter.wilayaId = parseInt(wilayaId);
    if (commune) filter.commune = commune;
    if (garageType) filter.garageType = garageType;
    if (specialty) filter.specialty = { $in: [specialty] };
    if (isAvailable !== undefined) filter.isAvailable = isAvailable === 'true';

    // Text search by name or description (case-insensitive regex)
    if (search) {
      const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.$or = [
        { name: { $regex: escapedSearch, $options: 'i' } },
        { description: { $regex: escapedSearch, $options: 'i' } }
      ];
    }

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
router.get('/:id', [
  param('id').isMongoId().withMessage('Valid provider ID is required'),
  validate
], async (req, res) => {
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
router.put('/:id', protect, isProfessional, [
  param('id').isMongoId().withMessage('Valid provider ID is required'),
  body('name').optional().trim().isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters'),
  body('description').optional().trim().isLength({ max: 2000 }).withMessage('Description must be at most 2000 characters'),
  body('phone').optional().trim().isLength({ max: 20 }).withMessage('Phone must be at most 20 characters'),
  body('specialty').optional().isArray().withMessage('Specialty must be an array'),
  body('image').optional().trim().isURL().withMessage('Image must be a valid URL'),
  body('isAvailable').optional().isBoolean().withMessage('isAvailable must be a boolean'),
  body('workingDays').optional().isArray().withMessage('Working days must be an array'),
  body('workingHours.start').optional().matches(/^\d{2}:\d{2}$/).withMessage('workingHours.start must be HH:MM'),
  body('workingHours.end').optional().matches(/^\d{2}:\d{2}$/).withMessage('workingHours.end must be HH:MM'),
  validate
], async (req, res) => {
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
router.get('/user/:userId', protect, [
  param('userId').isMongoId().withMessage('Valid user ID is required'),
  validate
], async (req, res) => {
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
