import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import ServiceProvider from '../models/ServiceProvider.js';
import Notification from '../models/Notification.js';
import { protect } from '../middleware/auth.js';

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
    const { name, email, password, role, phone, garageType, wilayaId, commune } = req.body;

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
        description: `Professional ${role.toLowerCase()} service`,
        phone,
        specialty: [],
        workingDays: [0, 1, 2, 3, 4, 6],
        workingHours: { start: '08:00', end: '17:00' }
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

    // Create welcome notification
    await Notification.create({
      userId: user._id,
      title: `Welcome back, ${user.name}!`,
      message: 'You have successfully logged in to SOS Auto DZ.',
      type: 'SUCCESS'
    });

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
    isAvailable: req.user.isAvailable
  });
});

export default router;
