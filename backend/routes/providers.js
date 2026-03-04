import express from 'express';
import { body, param, query } from 'express-validator';
import { Readable } from 'stream';
import multer from 'multer';
import ServiceProvider from '../models/ServiceProvider.js';
import User from '../models/User.js';
import { protect, isProfessional } from '../middleware/auth.js';
import validate from '../middleware/validate.js';
import cloudinary from '../config/cloudinary.js';
import { devError } from '../utils/errors.js';

const router = express.Router();

// Multer memory storage (no disk writes)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files are allowed'), false);
  }
});

// Helper: upload buffer to Cloudinary
const uploadToCloudinary = (buffer, folder, publicId) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, public_id: publicId, overwrite: true, resource_type: 'image' },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    Readable.from(buffer).pipe(stream);
  });
};

// @route   GET /api/providers
// @desc    Get all service providers with filters (paginated)
// @access  Public
router.get('/', [
  query('role').optional().isIn(['MECHANIC', 'PARTS_SHOP', 'TOWING']).withMessage('Invalid role'),
  query('wilayaId').optional().isInt({ min: 1, max: 58 }).withMessage('Wilaya ID must be 1-58'),
  query('commune').optional().trim(),
  query('garageType').optional().trim(),
  query('specialty').optional().trim(),
  query('search').optional().trim().isLength({ max: 100 }).withMessage('Search query must be at most 100 characters'),
  query('isAvailable').optional().isIn(['true', 'false']).withMessage('isAvailable must be true or false'),
  query('page').optional().isInt({ min: 1 }).withMessage('page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('limit must be between 1 and 100'),
  validate
], async (req, res) => {
  try {
    const { role, wilayaId, commune, garageType, specialty, isAvailable, search } = req.query;

    // Build filter object — only show verified providers in public results
    const filter = { isVerified: 'APPROVED' };
    
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

    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const skip = (page - 1) * limit;

    const [total, providers] = await Promise.all([
      ServiceProvider.countDocuments(filter),
      ServiceProvider.find(filter).sort({ rating: -1 }).skip(skip).limit(limit)
    ]);

    res.json({ data: providers, total, page, pages: Math.ceil(total / limit) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', ...devError(error) });
  }
});

// @route   GET /api/providers/stats
// @desc    Get public platform statistics for homepage
// @access  Public
router.get('/stats', async (req, res) => {
  try {
    const [totalProviders, wilayaIds, ratingResult] = await Promise.all([
      ServiceProvider.countDocuments({ isVerified: 'APPROVED' }),
      ServiceProvider.distinct('wilayaId', { isVerified: 'APPROVED' }),
      ServiceProvider.aggregate([
        { $match: { isVerified: 'APPROVED', totalReviews: { $gt: 0 } } },
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
    res.status(500).json({ message: 'Server error', ...devError(error) });
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
    res.status(500).json({ message: 'Server error', ...devError(error) });
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
  body('profileImage').optional().trim().isURL().withMessage('profileImage must be a valid URL'),
  body('isAvailable').optional().isBoolean().withMessage('isAvailable must be a boolean'),
  body('workingDays').optional().isArray().withMessage('Working days must be an array'),
  body('workingHours.start').optional().matches(/^\d{2}:\d{2}$/).withMessage('workingHours.start must be HH:MM'),
  body('workingHours.end').optional().matches(/^\d{2}:\d{2}$/).withMessage('workingHours.end must be HH:MM'),
  body('services').optional().isArray({ max: 50 }).withMessage('services must be an array of at most 50 items'),
  body('services.*.name').optional().trim().isLength({ min: 1, max: 100 }).withMessage('Service name must be 1-100 characters'),
  body('services.*.price').optional().isFloat({ min: 0 }).withMessage('Service price must be a non-negative number'),
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
      profileImage,
      isAvailable,
      workingDays,
      workingHours,
      services
    } = req.body;

    // Update fields
    if (name) provider.name = name;
    if (description) provider.description = description;
    if (phone) provider.phone = phone;
    if (specialty) provider.specialty = specialty;
    if (profileImage) provider.profileImage = profileImage;
    if (isAvailable !== undefined) provider.isAvailable = isAvailable;
    if (workingDays) provider.workingDays = workingDays;
    if (workingHours) provider.workingHours = workingHours;
    if (services !== undefined) provider.services = services;

    const updatedProvider = await provider.save();

    // Sync name/phone back to the User model to prevent mismatches
    if (name || phone) {
      const userUpdate = {};
      if (name) userUpdate.name = name;
      if (phone) userUpdate.phone = phone;
      await User.findByIdAndUpdate(provider.userId, userUpdate);
    }

    res.json(updatedProvider);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', ...devError(error) });
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
    // FIXED: Added ownership/admin check — any authenticated user could previously retrieve
    // another user's full provider profile (including phone) by supplying an arbitrary userId.
    if (req.user._id.toString() !== req.params.userId && req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const provider = await ServiceProvider.findOne({ userId: req.params.userId });

    if (!provider) {
      return res.status(404).json({ message: 'Provider profile not found' });
    }

    res.json(provider);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', ...devError(error) });
  }
});

// @route   POST /api/providers/:id/image
// @desc    Upload / update provider shop/garage image (saved to Cloudinary)
// @access  Private (Professional, owner only)
router.post('/:id/image', protect, isProfessional, [
  param('id').isMongoId().withMessage('Valid provider ID is required'),
  validate
], upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image file provided' });
    }

    const provider = await ServiceProvider.findById(req.params.id);
    if (!provider) {
      return res.status(404).json({ message: 'Provider not found' });
    }

    // Check ownership
    if (provider.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this provider' });
    }

    // Upload to Cloudinary
    const result = await uploadToCloudinary(
      req.file.buffer,
      'sos-auto-dz/providers',
      `provider_${provider._id}`
    );

    provider.profileImage = result.secure_url;
    await provider.save();

    res.json({ message: 'Provider image updated', profileImage: result.secure_url });
  } catch (error) {
    console.error('Provider image upload error:', error);
    res.status(500).json({ message: 'Failed to upload image', ...devError(error) });
  }
});

// @route   POST /api/providers/:id/gallery
// @desc    Upload photos to provider gallery (max 8 total, up to 4 at a time)
// @access  Private (Professional, owner only)
router.post('/:id/gallery', protect, isProfessional, [
  param('id').isMongoId().withMessage('Valid provider ID is required'),
  validate
], upload.array('images', 4), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No image files provided' });
    }

    const provider = await ServiceProvider.findById(req.params.id);
    if (!provider) {
      return res.status(404).json({ message: 'Provider not found' });
    }

    if (provider.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this provider' });
    }

    const currentCount = provider.images?.length || 0;
    const maxImages = 8;
    const available = maxImages - currentCount;

    if (available <= 0) {
      return res.status(400).json({ message: 'Gallery is full (max 8 images)' });
    }

    const filesToUpload = req.files.slice(0, available);
    const uploadedImages = [];

    // FIXED: Upload gallery images in parallel instead of sequentially — the original for-loop
    // awaited each Cloudinary upload one-by-one, making 4 uploads take ~4x as long as necessary.
    const uploadResults = await Promise.all(
      filesToUpload.map((file, i) => {
        const publicId = `provider_${provider._id}_gallery_${Date.now()}_${i}`;
        return uploadToCloudinary(file.buffer, 'sos-auto-dz/gallery', publicId);
      })
    );
    for (const result of uploadResults) {
      uploadedImages.push({ url: result.secure_url, publicId: result.public_id });
    }

    if (!provider.images) provider.images = [];
    provider.images.push(...uploadedImages);
    await provider.save();

    res.json({ message: `${uploadedImages.length} photo(s) uploaded`, images: provider.images });
  } catch (error) {
    console.error('Gallery upload error:', error);
    res.status(500).json({ message: 'Failed to upload images', ...devError(error) });
  }
});

// @route   DELETE /api/providers/:id/gallery/:publicId
// @desc    Delete a photo from provider gallery
// @access  Private (Professional, owner only)
router.delete('/:id/gallery/:publicId', protect, isProfessional, [
  param('id').isMongoId().withMessage('Valid provider ID is required'),
  param('publicId').notEmpty().withMessage('Public ID is required'),
  validate
], async (req, res) => {
  try {
    const provider = await ServiceProvider.findById(req.params.id);
    if (!provider) {
      return res.status(404).json({ message: 'Provider not found' });
    }

    if (provider.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this provider' });
    }

    // The publicId from the URL uses -- as separator (/ is not URL-safe)
    const fullPublicId = req.params.publicId.replace(/--/g, '/');

    const imgIndex = provider.images?.findIndex(img => img.publicId === fullPublicId);
    if (imgIndex === undefined || imgIndex === -1) {
      return res.status(404).json({ message: 'Image not found in gallery' });
    }

    // Delete from Cloudinary
    try {
      await cloudinary.uploader.destroy(fullPublicId);
    } catch (e) {
      console.error('Cloudinary delete warning:', e);
    }

    provider.images.splice(imgIndex, 1);
    await provider.save();

    res.json({ message: 'Photo deleted', images: provider.images });
  } catch (error) {
    console.error('Gallery delete error:', error);
    res.status(500).json({ message: 'Failed to delete image', ...devError(error) });
  }
});

export default router;
