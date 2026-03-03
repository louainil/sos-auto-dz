import express from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import multer from 'multer';
import { Readable } from 'stream';
import { transporter, getFromAddress, sendVerificationEmail } from '../config/email.js';
import { body } from 'express-validator';
import User from '../models/User.js';
import ServiceProvider from '../models/ServiceProvider.js';
import Notification from '../models/Notification.js';
import Booking from '../models/Booking.js';
import Review from '../models/Review.js';
import { protect } from '../middleware/auth.js';
import validate from '../middleware/validate.js';
import cloudinary from '../config/cloudinary.js';
import { devError } from '../utils/errors.js';

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

// Generate short-lived JWT access token (1 hour)
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '1h'
  });
};

// Generate opaque refresh token value (40 random bytes)
const generateRefreshTokenValue = () => crypto.randomBytes(40).toString('hex');

const REFRESH_TOKEN_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

// Shared cookie options factory — sameSite must be 'none' in production so
// that cookies cross Vercel's subdomain boundary (vercel.app is in the PSL).
const cookieOptions = (extraOptions = {}) => {
  const isProduction = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    path: '/',
    ...extraOptions,
  };
};

// clearCookie must mirror the original options (especially path/secure/sameSite)
// or some browsers won't remove the cookie.
const clearAuthCookies = (res) => {
  res.clearCookie('accessToken', cookieOptions());
  res.clearCookie('refreshToken', cookieOptions());
};

// Set refresh token as HttpOnly cookie
const setRefreshCookie = (res, tokenValue) => {
  res.cookie('refreshToken', tokenValue, cookieOptions({ maxAge: REFRESH_TOKEN_EXPIRY_MS }));
};

const ACCESS_TOKEN_EXPIRY_MS = 60 * 60 * 1000; // 1 hour

// Set access token as HttpOnly cookie
const setAccessCookie = (res, tokenValue) => {
  res.cookie('accessToken', tokenValue, cookieOptions({ maxAge: ACCESS_TOKEN_EXPIRY_MS }));
};

// Email transporter and from address imported from ../config/email.js

// Allowed roles for registration (ADMIN is excluded)
const ALLOWED_ROLES = ['CLIENT', 'MECHANIC', 'PARTS_SHOP', 'TOWING'];

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', [
  body('name').trim().notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters'),
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').isIn(ALLOWED_ROLES).withMessage(`Role must be one of: ${ALLOWED_ROLES.join(', ')}`),
  body('phone').optional().trim().isLength({ max: 20 }).withMessage('Phone must be at most 20 characters'),
  body('wilayaId').optional().isInt({ min: 1, max: 58 }).withMessage('Wilaya ID must be between 1 and 58').toInt(),
  body('commune').optional().trim().isLength({ max: 100 }),
  body('garageType').optional().trim(),
  body('description').optional().trim().isLength({ max: 1000 }),
  body('specialty').optional().isArray(),
  body('workingDays').optional().isArray(),
  body('workingHours.start').optional().matches(/^\d{2}:\d{2}$/).withMessage('workingHours.start must be HH:MM'),
  body('workingHours.end').optional().matches(/^\d{2}:\d{2}$/).withMessage('workingHours.end must be HH:MM'),
  validate
], async (req, res) => {
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

    // Generate email verification token
    const verifyToken = crypto.randomBytes(32).toString('hex');
    const hashedVerifyToken = crypto.createHash('sha256').update(verifyToken).digest('hex');

    user.emailVerificationToken = hashedVerifyToken;
    user.emailVerificationExpire = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    await user.save({ validateBeforeSave: false });

    // Send verification email
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const verifyUrl = `${frontendUrl}/verify-email?token=${verifyToken}&email=${encodeURIComponent(user.email)}`;

    try {
      await sendVerificationEmail({ to: user.email, name: user.name, verifyUrl });
    } catch (emailErr) {
      console.error('Verification email failed:', emailErr);
      // The user account was already created — tell them to retry via resend.
      return res.status(201).json({
        message: 'Account created but verification email could not be sent. Please use "Resend verification" to try again.',
        isEmailVerified: false,
        emailError: true
      });
    }

    // Do NOT issue auth tokens — the user must verify their email first.
    res.status(201).json({
      message: 'Registration successful. Please check your email to verify your account.',
      isEmailVerified: false
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', ...devError(error) });
  }
});

// @route   POST /api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', [
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
  validate
], async (req, res) => {
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

    // Block unverified users
    if (!user.isEmailVerified) {
      return res.status(403).json({
        message: 'Please verify your email before logging in. Check your inbox for the verification link.',
        needsVerification: true,
        email: user.email
      });
    }

    const rfTokenValue = generateRefreshTokenValue();
    user.refreshToken = crypto.createHash('sha256').update(rfTokenValue).digest('hex');
    user.refreshTokenExpire = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_MS);
    await user.save({ validateBeforeSave: false });

    const accessToken = generateToken(user._id);
    setRefreshCookie(res, rfTokenValue);
    setAccessCookie(res, accessToken);

    // Return tokens in body too so the frontend can use Authorization headers
    // when cross-origin cookies are blocked by the browser.
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
      isEmailVerified: user.isEmailVerified,
      accessToken,
      refreshToken: rfTokenValue,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', ...devError(error) });
  }
});

// @route   GET /api/auth/verify-email
// @desc    Verify user email with token
// @access  Public
router.get('/verify-email', async (req, res) => {
  try {
    const { token, email } = req.query;

    if (!token || !email) {
      return res.status(400).json({ message: 'Token and email are required' });
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      email,
      emailVerificationToken: hashedToken,
      emailVerificationExpire: { $gt: Date.now() },
    }).select('+emailVerificationToken +emailVerificationExpire');

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired verification link' });
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpire = undefined;
    await user.save({ validateBeforeSave: false });

    // Auto-verify the provider profile so they appear in search results
    if (['MECHANIC', 'PARTS_SHOP', 'TOWING'].includes(user.role)) {
      await ServiceProvider.findOneAndUpdate(
        { userId: user._id },
        { isVerified: true }
      );
    }

    res.json({ message: 'Email verified successfully. You can now log in.' });
  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({ message: 'Server error', ...devError(error) });
  }
});

// @route   POST /api/auth/resend-verification
// @desc    Resend email verification link
// @access  Public
router.post('/resend-verification', [
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  validate
], async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      // Don't reveal if user exists
      return res.json({ message: 'If an account with that email exists, a verification link has been sent.' });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({ message: 'Email is already verified' });
    }

    // Generate new token
    const verifyToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(verifyToken).digest('hex');

    user.emailVerificationToken = hashedToken;
    user.emailVerificationExpire = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await user.save({ validateBeforeSave: false });

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const verifyUrl = `${frontendUrl}/verify-email?token=${verifyToken}&email=${encodeURIComponent(user.email)}`;

    await sendVerificationEmail({ to: user.email, name: user.name, verifyUrl });

    res.json({ message: 'If an account with that email exists, a verification link has been sent.' });
  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({ message: 'Failed to send verification email. Please try again later.' });
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
    avatar: req.user.avatar,
    isEmailVerified: req.user.isEmailVerified
  });
});

// @route   PUT /api/auth/profile
// @desc    Update user name & phone in MongoDB
// @access  Private
router.put('/profile', protect, [
  body('name').optional().trim().isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters'),
  body('phone').optional().trim().isLength({ max: 20 }).withMessage('Phone must be at most 20 characters'),
  validate
], async (req, res) => {
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
    res.status(500).json({ message: 'Server error', ...devError(error) });
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
    res.status(500).json({ message: 'Failed to upload avatar', ...devError(error) });
  }
});

// @route   PUT /api/auth/password
// @desc    Change user password
// @access  Private
// Validated with: currentPassword (required), newPassword (min 6 chars)
router.put('/password', protect, [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
  validate
], async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id).select('+password');
    if (!user) return res.status(404).json({ message: 'User not found' });

    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    user.password = newPassword;
    user.refreshToken = undefined;
    user.refreshTokenExpire = undefined;
    await user.save();
    clearAuthCookies(res);
    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Password change error:', error);
    res.status(500).json({ message: 'Server error', ...devError(error) });
  }
});

// @route   POST /api/auth/forgot-password
// @desc    Send password reset email with token
// @access  Public
router.post('/forgot-password', [
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  validate
], async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      // Return success even if user not found to prevent email enumeration
      return res.json({ message: 'If an account with that email exists, a reset link has been sent.' });
    }

    // Generate a random reset token
    const resetToken = crypto.randomBytes(32).toString('hex');

    // Hash the token before storing in DB
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    // Save hashed token and expiry (1 hour) to the user
    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpire = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await user.save({ validateBeforeSave: false });

    // Build the reset URL (frontend will handle this route)
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const resetUrl = `${frontendUrl}?resetToken=${resetToken}&email=${encodeURIComponent(user.email)}`;

    // Send the email
    await transporter.sendMail({
      from: getFromAddress(),
      to: user.email,
      subject: 'SOS Auto DZ — Password Reset',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #2563eb;">SOS Auto DZ</h2>
          <p>Hello <strong>${user.name}</strong>,</p>
          <p>You requested a password reset. Click the button below to set a new password:</p>
          <a href="${resetUrl}" style="display: inline-block; background: #2563eb; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; margin: 16px 0;">Reset Password</a>
          <p style="color: #64748b; font-size: 13px;">This link expires in <strong>1 hour</strong>. If you did not request this, ignore this email.</p>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
          <p style="color: #94a3b8; font-size: 12px;">SOS Auto DZ — Roadside assistance across Algeria</p>
        </div>
      `,
    });

    res.json({ message: 'If an account with that email exists, a reset link has been sent.' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Failed to send reset email. Please try again later.' });
  }
});

// @route   POST /api/auth/reset-password
// @desc    Reset password using token from email
// @access  Public
router.post('/reset-password', [
  body('token').notEmpty().withMessage('Reset token is required'),
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('newPassword').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  validate
], async (req, res) => {
  try {
    const { token, email, newPassword } = req.body;

    // Hash the incoming token to compare with the stored hash
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Find user with matching token that hasn't expired
    const user = await User.findOne({
      email,
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() },
    }).select('+resetPasswordToken +resetPasswordExpire');

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    // Update password and clear reset fields
    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    user.refreshToken = undefined;
    user.refreshTokenExpire = undefined;
    await user.save();
    clearAuthCookies(res);
    res.json({ message: 'Password has been reset successfully. You can now log in.' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Server error', ...devError(error) });
  }
});

// @route   POST /api/auth/logout
// @desc    Logout: clear refresh token from DB and cookie
// @access  Private
router.post('/logout', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('+refreshToken +refreshTokenExpire');
    if (user) {
      user.refreshToken = undefined;
      user.refreshTokenExpire = undefined;
      await user.save({ validateBeforeSave: false });
    }
    clearAuthCookies(res);
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: 'Server error', ...devError(error) });
  }
});

// @route   DELETE /api/auth/account
// @desc    Permanently delete own account and all associated data (cascade)
// @access  Private
router.delete('/account', protect, [
  body('password').notEmpty().withMessage('Password is required to confirm account deletion'),
  validate
], async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('+password');
    if (!user) return res.status(404).json({ message: 'User not found' });

    const isMatch = await user.matchPassword(req.body.password);
    if (!isMatch) return res.status(401).json({ message: 'Incorrect password. Account not deleted.' });

    const userId = user._id;

    // Find provider profile (if any) to clean up Cloudinary gallery images
    const provider = await ServiceProvider.findOne({ userId });
    if (provider) {
      for (const img of provider.images || []) {
        try { await cloudinary.uploader.destroy(img.publicId); } catch { /* ignore – best-effort */ }
      }
    }

    // Cascade delete all related documents in parallel
    await Promise.all([
      ServiceProvider.deleteOne({ userId }),
      Booking.deleteMany({
        $or: [
          { clientId: userId },
          ...(provider ? [{ providerId: provider._id }] : [])
        ]
      }),
      Notification.deleteMany({ userId }),
      Review.deleteMany({ clientId: userId }),
      ...(provider ? [Review.deleteMany({ providerId: provider._id })] : []),
    ]);

    // Delete the user account itself
    await user.deleteOne();

    // Clear auth cookies so the browser session ends immediately
    clearAuthCookies(res);
    res.json({ message: 'Account deleted successfully.' });
  } catch (error) {
    console.error('Account deletion error:', error);
    res.status(500).json({ message: 'Server error', ...devError(error) });
  }
});

// @route   POST /api/auth/refresh
// @desc    Issue a new access token using the HttpOnly refresh token cookie
// @access  Public (requires refresh cookie)
router.post('/refresh', async (req, res) => {
  // Accept refresh token from cookie OR request body (cross-origin fallback)
  const tokenValue = req.cookies?.refreshToken || req.body?.refreshToken;
  if (!tokenValue) {
    return res.status(401).json({ message: 'No refresh token' });
  }
  try {
    const hashed = crypto.createHash('sha256').update(tokenValue).digest('hex');
    const user = await User.findOne({
      refreshToken: hashed,
      refreshTokenExpire: { $gt: Date.now() },
    }).select('+refreshToken +refreshTokenExpire');
    if (!user) {
      res.clearCookie('refreshToken', cookieOptions());
      return res.status(401).json({ message: 'Invalid or expired refresh token' });
    }
    // Rotate: issue a new refresh token
    const newRfTokenValue = generateRefreshTokenValue();
    user.refreshToken = crypto.createHash('sha256').update(newRfTokenValue).digest('hex');
    user.refreshTokenExpire = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_MS);
    await user.save({ validateBeforeSave: false });

    const newAccessToken = generateToken(user._id);
    setRefreshCookie(res, newRfTokenValue);
    setAccessCookie(res, newAccessToken);
    // Return tokens in body for cross-origin cookie fallback
    res.json({ success: true, accessToken: newAccessToken, refreshToken: newRfTokenValue });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(500).json({ message: 'Server error', ...devError(error) });
  }
});

export default router;
