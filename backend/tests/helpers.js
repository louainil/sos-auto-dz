/**
 * Test helpers — mock data factories and JWT token generator.
 */

import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

const objectId = () => new mongoose.Types.ObjectId();

/**
 * Generate a valid JWT token for a test user.
 */
export const generateToken = (userId) => {
  return jwt.sign({ id: userId.toString() }, process.env.JWT_SECRET, { expiresIn: '1d' });
};

/**
 * Create a mock User document (matches Mongoose doc shape).
 */
export const createMockUser = (overrides = {}) => {
  const id = overrides._id || objectId();
  return {
    _id: id,
    id: id.toString(),
    name: 'Test User',
    email: 'test@example.com',
    role: 'CLIENT',
    phone: '0555123456',
    garageType: undefined,
    wilayaId: 16,
    commune: 'Alger Centre',
    isAvailable: true,
    avatar: { url: '', publicId: '' },
    matchPassword: async (pw) => pw === 'password123',
    save: async function () { return this; },
    toObject: function () { return { ...this }; },
    ...overrides
  };
};

/**
 * Create a mock ServiceProvider document.
 */
export const createMockProvider = (overrides = {}) => {
  const id = overrides._id || objectId();
  const userId = overrides.userId || objectId();
  return {
    _id: id,
    userId,
    name: 'Test Provider',
    role: 'MECHANIC',
    garageType: 'MECHANIC',
    wilayaId: 16,
    commune: 'Alger Centre',
    description: 'Professional mechanic service',
    rating: 4.5,
    phone: '0555987654',
    specialty: ['Engine', 'Brakes'],
    image: '',
    isAvailable: true,
    workingDays: [0, 1, 2, 3, 4, 6],
    workingHours: { start: '08:00', end: '17:00' },
    totalReviews: 5,
    isVerified: true,
    save: async function () { return this; },
    toObject: function () { return { ...this }; },
    populate: function () { return this; },
    ...overrides
  };
};

/**
 * Create a mock Booking document.
 */
export const createMockBooking = (overrides = {}) => {
  const id = overrides._id || objectId();
  return {
    _id: id,
    providerId: overrides.providerId || objectId(),
    providerName: 'Test Provider',
    providerPhone: '0555987654',
    clientId: overrides.clientId || objectId(),
    clientName: 'Test User',
    clientPhone: '0555123456',
    date: new Date(Date.now() + 86400000), // tomorrow
    issue: 'Engine problem',
    status: 'PENDING',
    price: undefined,
    createdAt: new Date(),
    updatedAt: new Date(),
    save: async function () { return this; },
    deleteOne: async function () { return {}; },
    toObject: function () { return { ...this }; },
    ...overrides
  };
};

/**
 * Create a mock Notification document.
 */
export const createMockNotification = (overrides = {}) => {
  const id = overrides._id || objectId();
  return {
    _id: id,
    userId: overrides.userId || objectId(),
    title: 'Test Notification',
    message: 'Test message',
    type: 'INFO',
    isRead: false,
    createdAt: new Date(),
    ...overrides
  };
};

export { objectId };
