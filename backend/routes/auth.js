import express from 'express';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import { Readable } from 'stream';
import User from '../models/User.js';
import ServiceProvider from '../models/ServiceProvider.js';
import Notification from '../models/Notification.js';
import { protect } from '../middleware/auth.js';
import cloudinary from '../config/cloudinary.js';

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

const router = express.Router();

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d'
  });
};

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', async (req, res) => {
  try {
    const {
      name, email, password, role, phone, garageType, wilayaId, commune,
      description, specialty, workingDays, workingHours
    } = req.body;

    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      role,
      phone,
      garageType: role === 'MECHANIC' ? garageType : undefined,
      wilayaId,
      commune
    });

    // If professional, create service provider profile
    if (['MECHANIC', 'PARTS_SHOP', 'TOWING'].includes(role)) {
      await ServiceProvider.create({
        userId: user._id,
        name,
        role,
        garageType: role === 'MECHANIC' ? garageType : undefined,
        wilayaId,
        commune,
        description: description?.trim() || `Professional ${role.toLowerCase()} service`,
        phone,
        specialty: Array.isArray(specialty) ? specialty : [],
        workingDays: Array.isArray(workingDays) ? workingDays : [0, 1, 2, 3, 4, 6],
        workingHours: {
          start: workingHours?.start || '08:00',
          end: workingHours?.end || '17:00'
        }
      });
    }

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      garageType: user.garageType,
      wilayaId: user.wilayaId,
      commune: user.commune,
      isAvailable: user.isAvailable,
      avatar: user.avatar,
      token: generateToken(user._id)
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check for user email
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Check password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      garageType: user.garageType,
      wilayaId: user.wilayaId,
      commune: user.commune,
      isAvailable: user.isAvailable,
      avatar: user.avatar,
      token: generateToken(user._id)
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', protect, async (req, res) => {
  res.json({
    _id: req.user._id,
    name: req.user.name,
    email: req.user.email,
    role: req.user.role,
    phone: req.user.phone,
    garageType: req.user.garageType,
    wilayaId: req.user.wilayaId,
    commune: req.user.commune,
    isAvailable: req.user.isAvailable,
    avatar: req.user.avatar
  });
});

// @route   PUT /api/auth/profile
// @desc    Update user name & phone in MongoDB
// @access  Private
router.put('/profile', protect, async (req, res) => {
  try {
    const { name, phone } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (name && name.trim()) user.name = name.trim();
    if (phone !== undefined) user.phone = phone;
    await user.save();

    // Also update ServiceProvider name if professional
    if (['MECHANIC', 'PARTS_SHOP', 'TOWING'].includes(user.role)) {
      await ServiceProvider.findOneAndUpdate(
        { userId: user._id },
        { name: user.name, phone: user.phone }
      );
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      garageType: user.garageType,
      wilayaId: user.wilayaId,
      commune: user.commune,
      isAvailable: user.isAvailable,
      avatar: user.avatar
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/auth/avatar
// @desc    Upload / update user profile picture (saved to Cloudinary)
// @access  Private
router.post('/avatar', protect, upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image file provided' });
    }

    const user = await User.findById(req.user._id);

    // Delete old image from Cloudinary if it exists
    if (user.avatar?.publicId) {
      await cloudinary.uploader.destroy(user.avatar.publicId);
    }

    // Upload new image to Cloudinary
    const result = await uploadToCloudinary(
      req.file.buffer,
      'sos-auto-dz/avatars',
      `avatar_${req.user._id}`
    );

    // Save Cloudinary URL and public_id to MongoDB
    user.avatar = {
      url: result.secure_url,
      publicId: result.public_id
    };
    await user.save();

    res.json({
      message: 'Avatar updated successfully',
      avatar: user.avatar
    });
  } catch (error) {
    console.error('Avatar upload error:', error);
    res.status(500).json({ message: 'Failed to upload avatar', error: error.message });
  }
});

// @route   PUT /api/auth/password
// @desc    Change user password
// @access  Private
router.put('/password', protect, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Please provide current and new password' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters' });
    }

    const user = await User.findById(req.user._id).select('+password');
    if (!user) return res.status(404).json({ message: 'User not found' });

    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    user.password = newPassword;
    await user.save();

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Password change error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;
