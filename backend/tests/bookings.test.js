/**
 * Bookings route tests — POST / GET / PUT / DELETE /api/bookings
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { createMockUser, createMockProvider, createMockBooking, generateToken, objectId } from './helpers.js';

// ─── Mocks ──────────────────────────────────────────────

vi.mock('../models/User.js', () => {
  const m = vi.fn();
  m.findOne = vi.fn();
  m.findById = vi.fn();
  m.create = vi.fn();
  return { default: m };
});

vi.mock('../models/ServiceProvider.js', () => {
  const m = vi.fn();
  m.find = vi.fn();
  m.findOne = vi.fn();
  m.findById = vi.fn();
  m.findByIdAndUpdate = vi.fn();
  m.findOneAndUpdate = vi.fn();
  m.create = vi.fn();
  m.countDocuments = vi.fn();
  m.distinct = vi.fn();
  m.aggregate = vi.fn();
  return { default: m };
});

vi.mock('../models/Booking.js', () => {
  const m = vi.fn();
  m.find = vi.fn();
  m.findById = vi.fn();
  m.create = vi.fn();
  return { default: m };
});

vi.mock('../models/Notification.js', () => {
  const m = vi.fn();
  m.find = vi.fn();
  m.create = vi.fn();
  return { default: m };
});

vi.mock('../models/Review.js', () => {
  const m = vi.fn();
  m.find = vi.fn();
  m.findOne = vi.fn();
  m.create = vi.fn();
  m.aggregate = vi.fn();
  return { default: m };
});

const { default: User } = await import('../models/User.js');
const { default: ServiceProvider } = await import('../models/ServiceProvider.js');
const { default: Booking } = await import('../models/Booking.js');
const { default: Notification } = await import('../models/Notification.js');
const { default: app } = await import('../server.js');

// ─── Helper: auth setup ─────────────────────────────────
const setupAuth = (userOverrides = {}) => {
  const user = createMockUser(userOverrides);
  const token = generateToken(user._id);
  // protect middleware: User.findById(decoded.id).select('-password')
  User.findById.mockReturnValue({
    select: vi.fn().mockResolvedValue(user)
  });
  return { user, token };
};

// ─── Tests ──────────────────────────────────────────────

describe('Bookings Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ────────────────────────────────────────
  // POST /api/bookings
  // ────────────────────────────────────────
  describe('POST /api/bookings', () => {
    const providerId = objectId();
    const tomorrow = new Date(Date.now() + 86400000).toISOString();

    const validBody = {
      providerId: providerId.toString(),
      date: tomorrow,
      issue: 'Flat tire, need help'
    };

    it('should create a booking successfully', async () => {
      const { user, token } = setupAuth();
      const provider = createMockProvider({ _id: providerId });
      ServiceProvider.findById.mockResolvedValue(provider);
      Booking.create.mockResolvedValue(createMockBooking({ clientId: user._id, providerId }));
      Notification.create.mockResolvedValue({ _id: objectId(), title: 'New Booking Request', message: 'test', type: 'INFO', isRead: false, createdAt: new Date() });

      const res = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${token}`)
        .send(validBody);

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('_id');
      expect(Booking.create).toHaveBeenCalled();
      expect(Notification.create).toHaveBeenCalled();
    });

    it('should return 404 if provider not found', async () => {
      const { token } = setupAuth();
      ServiceProvider.findById.mockResolvedValue(null);

      const res = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${token}`)
        .send(validBody);

      expect(res.status).toBe(404);
      expect(res.body.message).toMatch(/provider not found/i);
    });

    it('should return 400 for past date', async () => {
      const { token } = setupAuth();
      const yesterday = new Date(Date.now() - 2 * 86400000).toISOString();

      const res = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${token}`)
        .send({ ...validBody, date: yesterday });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/past/i);
    });

    it('should return 400 for missing issue', async () => {
      const { token } = setupAuth();

      const res = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${token}`)
        .send({ providerId: providerId.toString(), date: tomorrow });

      expect(res.status).toBe(400);
    });

    it('should return 400 for invalid providerId', async () => {
      const { token } = setupAuth();

      const res = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${token}`)
        .send({ providerId: 'not-a-valid-id', date: tomorrow, issue: 'test' });

      expect(res.status).toBe(400);
    });

    it('should return 401 without authentication', async () => {
      const res = await request(app)
        .post('/api/bookings')
        .send(validBody);

      expect(res.status).toBe(401);
    });
  });

  // ────────────────────────────────────────
  // GET /api/bookings
  // ────────────────────────────────────────
  describe('GET /api/bookings', () => {
    it('should return bookings for CLIENT (filtered by clientId)', async () => {
      const { user, token } = setupAuth({ role: 'CLIENT' });
      const bookings = [createMockBooking({ clientId: user._id })];
      Booking.find.mockReturnValue({ sort: vi.fn().mockResolvedValue(bookings) });

      const res = await request(app)
        .get('/api/bookings')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(Booking.find).toHaveBeenCalledWith({ clientId: user._id });
    });

    it('should return bookings for MECHANIC (filtered by providerId)', async () => {
      const providerId = objectId();
      const { user, token } = setupAuth({ role: 'MECHANIC' });
      ServiceProvider.findOne.mockResolvedValue(createMockProvider({ _id: providerId, userId: user._id }));
      Booking.find.mockReturnValue({
        sort: vi.fn().mockResolvedValue([createMockBooking({ providerId })])
      });

      const res = await request(app)
        .get('/api/bookings')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('should return 401 without authentication', async () => {
      const res = await request(app).get('/api/bookings');
      expect(res.status).toBe(401);
    });
  });

  // ────────────────────────────────────────
  // GET /api/bookings/:id
  // ────────────────────────────────────────
  describe('GET /api/bookings/:id', () => {
    it('should return a booking for the owning client', async () => {
      const { user, token } = setupAuth();
      const bookingId = objectId();
      const booking = createMockBooking({ _id: bookingId, clientId: user._id });
      Booking.findById.mockResolvedValue(booking);
      ServiceProvider.findById.mockResolvedValue(null); // not the provider

      const res = await request(app)
        .get(`/api/bookings/${bookingId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
    });

    it('should return 404 for non-existent booking', async () => {
      const { token } = setupAuth();
      const bookingId = objectId();
      Booking.findById.mockResolvedValue(null);

      const res = await request(app)
        .get(`/api/bookings/${bookingId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(404);
    });

    it('should return 403 for unauthorized user', async () => {
      const { token } = setupAuth(); // different user
      const bookingId = objectId();
      const booking = createMockBooking({ _id: bookingId, clientId: objectId() }); // different client
      Booking.findById.mockResolvedValue(booking);
      ServiceProvider.findById.mockResolvedValue(null); // not the provider either

      const res = await request(app)
        .get(`/api/bookings/${bookingId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(403);
    });

    it('should return 400 for invalid booking ID format', async () => {
      const { token } = setupAuth();

      const res = await request(app)
        .get('/api/bookings/not-valid-id')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(400);
    });
  });

  // ────────────────────────────────────────
  // PUT /api/bookings/:id
  // ────────────────────────────────────────
  describe('PUT /api/bookings/:id', () => {
    it('should update booking status when authorized', async () => {
      const { user, token } = setupAuth();
      const bookingId = objectId();
      const provider = createMockProvider();
      const booking = createMockBooking({
        _id: bookingId,
        clientId: user._id,
        providerId: provider._id,
        save: vi.fn().mockResolvedValue(
          createMockBooking({ _id: bookingId, clientId: user._id, status: 'CONFIRMED' })
        )
      });
      Booking.findById.mockResolvedValue(booking);
      ServiceProvider.findById.mockResolvedValue(provider);
      Notification.create.mockResolvedValue({ _id: objectId(), title: 'Booking Updated', message: 'test', type: 'INFO', isRead: false, createdAt: new Date() });

      const res = await request(app)
        .put(`/api/bookings/${bookingId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'CONFIRMED' });

      expect(res.status).toBe(200);
    });

    it('should return 400 for invalid status value', async () => {
      const { token } = setupAuth();
      const bookingId = objectId();

      const res = await request(app)
        .put(`/api/bookings/${bookingId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'INVALID_STATUS' });

      expect(res.status).toBe(400);
    });
  });

  // ────────────────────────────────────────
  // DELETE /api/bookings/:id
  // ────────────────────────────────────────
  describe('DELETE /api/bookings/:id', () => {
    it('should delete booking when client is the owner', async () => {
      const { user, token } = setupAuth();
      const bookingId = objectId();
      const booking = createMockBooking({
        _id: bookingId,
        clientId: user._id,
        deleteOne: vi.fn().mockResolvedValue({})
      });
      Booking.findById.mockResolvedValue(booking);

      const res = await request(app)
        .delete(`/api/bookings/${bookingId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toMatch(/removed/i);
    });

    it('should return 403 when not the booking owner', async () => {
      const { token } = setupAuth();
      const bookingId = objectId();
      const booking = createMockBooking({ _id: bookingId, clientId: objectId() }); // different owner
      Booking.findById.mockResolvedValue(booking);

      const res = await request(app)
        .delete(`/api/bookings/${bookingId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(403);
    });

    it('should return 404 for non-existent booking', async () => {
      const { token } = setupAuth();
      const bookingId = objectId();
      Booking.findById.mockResolvedValue(null);

      const res = await request(app)
        .delete(`/api/bookings/${bookingId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(404);
    });
  });
});
