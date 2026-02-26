/**
 * Global test setup for backend API tests.
 * 
 * Mocks Mongoose connection so tests don't need a real MongoDB instance.
 * Sets required environment variables for JWT, etc.
 */

import { vi } from 'vitest';

// Set environment variables before anything else
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing';
process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
process.env.FRONTEND_URL = 'http://localhost:3000';
process.env.NODE_ENV = 'test';
process.env.VERCEL = 'true'; // Prevent app.listen() in server.js during tests

// Mock the connectDB so it doesn't actually try to connect
vi.mock('../config/db.js', () => ({
  default: vi.fn().mockResolvedValue(true)
}));

// Mock cloudinary
vi.mock('../config/cloudinary.js', () => ({
  default: {
    uploader: {
      upload_stream: vi.fn(),
      destroy: vi.fn()
    }
  }
}));

// Mock nodemailer
vi.mock('nodemailer', () => ({
  default: {
    createTransport: vi.fn().mockReturnValue({
      sendMail: vi.fn().mockResolvedValue({ messageId: 'test-id' })
    })
  }
}));

// Disable rate limiting in tests — make it a passthrough middleware
vi.mock('express-rate-limit', () => ({
  default: () => (req, res, next) => next()
}));
