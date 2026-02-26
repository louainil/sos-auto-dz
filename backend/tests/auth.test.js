/**
 * Auth route tests — POST /api/auth/register, POST /api/auth/login, GET /api/auth/me,
 * PUT /api/auth/profile, PUT /api/auth/password, POST /api/auth/forgot-password,
 * POST /api/auth/reset-password
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { createMockUser, createMockProvider, generateToken, objectId } from './helpers.js';

// ─── Mocks ──────────────────────────────────────────────
// Mock Mongoose models BEFORE importing the app

const mockUser = createMockUser();
const mockUserId = mockUser._id;

vi.mock('../models/User.js', () => {
  const mockUserModel = vi.fn();

  // Static methods
  mockUserModel.findOne = vi.fn();
  mockUserModel.findById = vi.fn();
  mockUserModel.create = vi.fn();

  return { default: mockUserModel };
});

vi.mock('../models/ServiceProvider.js', () => {
  const mockProviderModel = vi.fn();
  mockProviderModel.find = vi.fn();
  mockProviderModel.findOne = vi.fn();
  mockProviderModel.findById = vi.fn();
  mockProviderModel.findByIdAndUpdate = vi.fn();
  mockProviderModel.findOneAndUpdate = vi.fn();
  mockProviderModel.create = vi.fn();
  mockProviderModel.countDocuments = vi.fn();
  mockProviderModel.distinct = vi.fn();
  mockProviderModel.aggregate = vi.fn();
  return { default: mockProviderModel };
});

vi.mock('../models/Notification.js', () => {
  const mockNotificationModel = vi.fn();
  mockNotificationModel.find = vi.fn();
  mockNotificationModel.create = vi.fn();
  return { default: mockNotificationModel };
});

vi.mock('../models/Booking.js', () => {
  const mockBookingModel = vi.fn();
  mockBookingModel.find = vi.fn();
  mockBookingModel.findById = vi.fn();
  mockBookingModel.create = vi.fn();
  return { default: mockBookingModel };
});

vi.mock('../models/Review.js', () => {
  const mockReviewModel = vi.fn();
  mockReviewModel.find = vi.fn();
  mockReviewModel.findOne = vi.fn();
  mockReviewModel.create = vi.fn();
  mockReviewModel.aggregate = vi.fn();
  return { default: mockReviewModel };
});

// Import models and app AFTER mocks
const { default: User } = await import('../models/User.js');
const { default: ServiceProvider } = await import('../models/ServiceProvider.js');
const { default: Notification } = await import('../models/Notification.js');
const { default: app } = await import('../server.js');

// ─── Tests ──────────────────────────────────────────────

describe('Auth Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ────────────────────────────────────────
  // POST /api/auth/register
  // ────────────────────────────────────────
  describe('POST /api/auth/register', () => {
    const validBody = {
      name: 'Ali Bensalem',
      email: 'ali@example.com',
      password: 'secure123',
      role: 'CLIENT',
      phone: '0555111222'
    };

    it('should register a new CLIENT and return user + token', async () => {
      User.findOne.mockResolvedValue(null); // no existing user
      const created = createMockUser({ name: 'Ali Bensalem', email: 'ali@example.com', role: 'CLIENT' });
      User.create.mockResolvedValue(created);

      const res = await request(app)
        .post('/api/auth/register')
        .send(validBody);

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('token');
      expect(res.body.name).toBe('Ali Bensalem');
      expect(res.body.role).toBe('CLIENT');
    });

    it('should register a MECHANIC and create a ServiceProvider profile', async () => {
      User.findOne.mockResolvedValue(null);
      const created = createMockUser({ name: 'Karim', role: 'MECHANIC' });
      User.create.mockResolvedValue(created);
      ServiceProvider.create.mockResolvedValue(createMockProvider());

      const res = await request(app)
        .post('/api/auth/register')
        .send({
          ...validBody,
          role: 'MECHANIC',
          garageType: 'MECHANIC',
          wilayaId: 16,
          commune: 'Alger Centre'
        });

      expect(res.status).toBe(201);
      expect(ServiceProvider.create).toHaveBeenCalled();
    });

    it('should return 400 if email already exists', async () => {
      User.findOne.mockResolvedValue(createMockUser());

      const res = await request(app)
        .post('/api/auth/register')
        .send(validBody);

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/already exists/i);
    });

    it('should return 400 for validation errors — missing name', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ ...validBody, name: '' });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/validation/i);
    });

    it('should return 400 for validation errors — short password', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ ...validBody, password: '123' });

      expect(res.status).toBe(400);
    });

    it('should return 400 for validation errors — invalid email', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ ...validBody, email: 'not-an-email' });

      expect(res.status).toBe(400);
    });

    it('should reject ADMIN role registration', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ ...validBody, role: 'ADMIN' });

      expect(res.status).toBe(400);
    });
  });

  // ────────────────────────────────────────
  // POST /api/auth/login
  // ────────────────────────────────────────
  describe('POST /api/auth/login', () => {
    it('should login with valid credentials and return token', async () => {
      const user = createMockUser();
      // findOne().select('+password') — need to mock the chain
      User.findOne.mockReturnValue({
        select: vi.fn().mockResolvedValue(user)
      });

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com', password: 'password123' });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body.email).toBe('test@example.com');
    });

    it('should return 401 for wrong email', async () => {
      User.findOne.mockReturnValue({
        select: vi.fn().mockResolvedValue(null)
      });

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'wrong@example.com', password: 'password123' });

      expect(res.status).toBe(401);
      expect(res.body.message).toMatch(/invalid/i);
    });

    it('should return 401 for wrong password', async () => {
      const user = createMockUser({ matchPassword: async () => false });
      User.findOne.mockReturnValue({
        select: vi.fn().mockResolvedValue(user)
      });

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com', password: 'wrongpassword' });

      expect(res.status).toBe(401);
      expect(res.body.message).toMatch(/invalid/i);
    });

    it('should return 400 for missing email', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ password: 'password123' });

      expect(res.status).toBe(400);
    });

    it('should return 400 for missing password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com' });

      expect(res.status).toBe(400);
    });
  });

  // ────────────────────────────────────────
  // GET /api/auth/me
  // ────────────────────────────────────────
  describe('GET /api/auth/me', () => {
    it('should return current user when authenticated', async () => {
      const user = createMockUser();
      const token = generateToken(user._id);

      // Auth middleware calls User.findById(decoded.id).select('-password')
      User.findById.mockReturnValue({
        select: vi.fn().mockResolvedValue(user)
      });

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.email).toBe('test@example.com');
    });

    it('should return 401 without token', async () => {
      const res = await request(app)
        .get('/api/auth/me');

      expect(res.status).toBe(401);
      expect(res.body.message).toMatch(/not authorized/i);
    });

    it('should return 401 with invalid token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token');

      expect(res.status).toBe(401);
    });
  });

  // ────────────────────────────────────────
  // PUT /api/auth/profile
  // ────────────────────────────────────────
  describe('PUT /api/auth/profile', () => {
    it('should update name and phone', async () => {
      const user = createMockUser();
      const token = generateToken(user._id);

      // First call: protect middleware — User.findById(decoded.id).select('-password')
      User.findById.mockReturnValueOnce({
        select: vi.fn().mockResolvedValue(user)
      });
      // Second call: route handler — User.findById(req.user._id)
      const savedUser = {
        ...user,
        save: vi.fn().mockImplementation(async function () { return this; })
      };
      User.findById.mockResolvedValueOnce(savedUser);

      const res = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'New Name', phone: '0555999888' });

      expect(res.status).toBe(200);
    });

    it('should return 401 without authentication', async () => {
      const res = await request(app)
        .put('/api/auth/profile')
        .send({ name: 'New Name' });

      expect(res.status).toBe(401);
    });
  });

  // ────────────────────────────────────────
  // PUT /api/auth/password
  // ────────────────────────────────────────
  describe('PUT /api/auth/password', () => {
    it('should return 400 for short new password', async () => {
      const user = createMockUser();
      const token = generateToken(user._id);
      // protect middleware
      User.findById.mockReturnValueOnce({
        select: vi.fn().mockResolvedValue(user)
      });

      const res = await request(app)
        .put('/api/auth/password')
        .set('Authorization', `Bearer ${token}`)
        .send({ currentPassword: 'password123', newPassword: '12' });

      expect(res.status).toBe(400);
    });

    it('should return 400 for missing current password', async () => {
      const user = createMockUser();
      const token = generateToken(user._id);
      // protect middleware
      User.findById.mockReturnValueOnce({
        select: vi.fn().mockResolvedValue(user)
      });

      const res = await request(app)
        .put('/api/auth/password')
        .set('Authorization', `Bearer ${token}`)
        .send({ newPassword: 'newpassword123' });

      expect(res.status).toBe(400);
    });
  });

  // ────────────────────────────────────────
  // POST /api/auth/forgot-password
  // ────────────────────────────────────────
  describe('POST /api/auth/forgot-password', () => {
    it('should return success message even when user not found (prevents enumeration)', async () => {
      User.findOne.mockResolvedValue(null);

      const res = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'unknown@example.com' });

      expect(res.status).toBe(200);
      expect(res.body.message).toMatch(/reset link/i);
    });

    it('should return 400 for invalid email format', async () => {
      const res = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'not-valid' });

      expect(res.status).toBe(400);
    });
  });

  // ────────────────────────────────────────
  // POST /api/auth/reset-password
  // ────────────────────────────────────────
  describe('POST /api/auth/reset-password', () => {
    it('should return 400 for missing token', async () => {
      const res = await request(app)
        .post('/api/auth/reset-password')
        .send({ email: 'test@example.com', newPassword: 'newpass123' });

      expect(res.status).toBe(400);
    });

    it('should return 400 for short password', async () => {
      const res = await request(app)
        .post('/api/auth/reset-password')
        .send({ token: 'sometoken', email: 'test@example.com', newPassword: '12' });

      expect(res.status).toBe(400);
    });

    it('should return 400 for invalid/expired token', async () => {
      User.findOne.mockReturnValue({
        select: vi.fn().mockResolvedValue(null) // token not found / expired
      });

      const res = await request(app)
        .post('/api/auth/reset-password')
        .send({ token: 'expired-token', email: 'test@example.com', newPassword: 'newpassword123' });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/invalid|expired/i);
    });
  });

  // ────────────────────────────────────────
  // Health / Root / 404
  // ────────────────────────────────────────
  describe('General endpoints', () => {
    it('GET /api/health should return OK', async () => {
      const res = await request(app).get('/api/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('OK');
    });

    it('GET / should return welcome message', async () => {
      const res = await request(app).get('/');
      expect(res.status).toBe(200);
      expect(res.body.message).toMatch(/welcome/i);
    });

    it('GET /nonexistent should return 404', async () => {
      const res = await request(app).get('/api/nonexistent');
      expect(res.status).toBe(404);
    });
  });
});
