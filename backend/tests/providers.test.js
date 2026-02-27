/**
 * Providers & Reviews route tests
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
const { default: Review } = await import('../models/Review.js');
const { default: app } = await import('../server.js');

// ─── Helper: auth setup ─────────────────────────────────
const setupAuth = (userOverrides = {}) => {
  const user = createMockUser(userOverrides);
  const token = generateToken(user._id);
  User.findById.mockReturnValue({
    select: vi.fn().mockResolvedValue(user)
  });
  return { user, token };
};

// ─── Provider Tests ─────────────────────────────────────

describe('Providers Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ────────────────────────────────────────
  // GET /api/providers
  // ────────────────────────────────────────
  describe('GET /api/providers', () => {
    it('should return all providers', async () => {
      const providers = [createMockProvider(), createMockProvider()];
      ServiceProvider.find.mockReturnValue({
        sort: vi.fn().mockResolvedValue(providers)
      });

      const res = await request(app).get('/api/providers');

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(2);
    });

    it('should filter by role', async () => {
      ServiceProvider.find.mockReturnValue({
        sort: vi.fn().mockResolvedValue([createMockProvider({ role: 'TOWING' })])
      });

      const res = await request(app).get('/api/providers?role=TOWING');

      expect(res.status).toBe(200);
      expect(ServiceProvider.find).toHaveBeenCalledWith(
        expect.objectContaining({ role: 'TOWING' })
      );
    });

    it('should filter by wilayaId', async () => {
      ServiceProvider.find.mockReturnValue({
        sort: vi.fn().mockResolvedValue([])
      });

      const res = await request(app).get('/api/providers?wilayaId=16');

      expect(res.status).toBe(200);
      expect(ServiceProvider.find).toHaveBeenCalledWith(
        expect.objectContaining({ wilayaId: 16 })
      );
    });

    it('should return 400 for invalid role filter', async () => {
      const res = await request(app).get('/api/providers?role=INVALID');
      expect(res.status).toBe(400);
    });

    it('should filter by search query (name/description regex)', async () => {
      ServiceProvider.find.mockReturnValue({
        sort: vi.fn().mockResolvedValue([createMockProvider({ name: 'Quick Fix Garage' })])
      });

      const res = await request(app).get('/api/providers?search=Quick');

      expect(res.status).toBe(200);
      expect(ServiceProvider.find).toHaveBeenCalledWith(
        expect.objectContaining({
          $or: [
            { name: { $regex: 'Quick', $options: 'i' } },
            { description: { $regex: 'Quick', $options: 'i' } }
          ]
        })
      );
    });

    it('should escape special regex characters in search query', async () => {
      ServiceProvider.find.mockReturnValue({
        sort: vi.fn().mockResolvedValue([])
      });

      const res = await request(app).get('/api/providers?search=test%2Bvalue');

      expect(res.status).toBe(200);
      expect(ServiceProvider.find).toHaveBeenCalledWith(
        expect.objectContaining({
          $or: [
            { name: { $regex: 'test\\+value', $options: 'i' } },
            { description: { $regex: 'test\\+value', $options: 'i' } }
          ]
        })
      );
    });
  });

  // ────────────────────────────────────────
  // GET /api/providers/stats
  // ────────────────────────────────────────
  describe('GET /api/providers/stats', () => {
    it('should return platform statistics', async () => {
      ServiceProvider.countDocuments.mockResolvedValue(25);
      ServiceProvider.distinct.mockResolvedValue([1, 2, 3, 16, 31]);
      ServiceProvider.aggregate.mockResolvedValue([{ _id: null, avgRating: 4.3 }]);

      const res = await request(app).get('/api/providers/stats');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('totalProviders', 25);
      expect(res.body).toHaveProperty('wilayasCovered', 5);
      expect(res.body).toHaveProperty('avgRating', 4.3);
    });

    it('should return 0 avgRating when no reviews exist', async () => {
      ServiceProvider.countDocuments.mockResolvedValue(0);
      ServiceProvider.distinct.mockResolvedValue([]);
      ServiceProvider.aggregate.mockResolvedValue([]);

      const res = await request(app).get('/api/providers/stats');

      expect(res.status).toBe(200);
      expect(res.body.avgRating).toBe(0);
    });
  });

  // ────────────────────────────────────────
  // GET /api/providers/:id
  // ────────────────────────────────────────
  describe('GET /api/providers/:id', () => {
    it('should return a provider by ID', async () => {
      const provider = createMockProvider();
      ServiceProvider.findById.mockReturnValue({
        populate: vi.fn().mockResolvedValue(provider)
      });

      const res = await request(app).get(`/api/providers/${provider._id}`);

      expect(res.status).toBe(200);
      expect(res.body.name).toBe('Test Provider');
    });

    it('should return 404 for non-existent provider', async () => {
      const id = objectId();
      ServiceProvider.findById.mockReturnValue({
        populate: vi.fn().mockResolvedValue(null)
      });

      const res = await request(app).get(`/api/providers/${id}`);

      expect(res.status).toBe(404);
    });

    it('should return 400 for invalid ID format', async () => {
      const res = await request(app).get('/api/providers/not-valid');
      expect(res.status).toBe(400);
    });
  });

  // ────────────────────────────────────────
  // PUT /api/providers/:id
  // ────────────────────────────────────────
  describe('PUT /api/providers/:id', () => {
    it('should update provider when authorized (professional owner)', async () => {
      const { user, token } = setupAuth({ role: 'MECHANIC' });
      const providerId = objectId();
      const provider = createMockProvider({
        _id: providerId,
        userId: user._id,
        save: vi.fn().mockResolvedValue(createMockProvider({ _id: providerId, name: 'Updated' }))
      });
      ServiceProvider.findById.mockResolvedValue(provider);

      const res = await request(app)
        .put(`/api/providers/${providerId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Updated' });

      expect(res.status).toBe(200);
    });

    it('should return 403 when user is CLIENT (not professional)', async () => {
      const { token } = setupAuth({ role: 'CLIENT' });
      const providerId = objectId();

      const res = await request(app)
        .put(`/api/providers/${providerId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Updated' });

      expect(res.status).toBe(403);
    });

    it('should return 403 when professional does not own the profile', async () => {
      const { token } = setupAuth({ role: 'MECHANIC' });
      const providerId = objectId();
      const provider = createMockProvider({ _id: providerId, userId: objectId() }); // different userId
      ServiceProvider.findById.mockResolvedValue(provider);

      const res = await request(app)
        .put(`/api/providers/${providerId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Hacked' });

      expect(res.status).toBe(403);
    });
  });

  // ────────────────────────────────────────
  // GET /api/providers/user/:userId
  // ────────────────────────────────────────
  describe('GET /api/providers/user/:userId', () => {
    it('should return provider by user ID', async () => {
      const { user, token } = setupAuth({ role: 'MECHANIC' });
      ServiceProvider.findOne.mockResolvedValue(createMockProvider({ userId: user._id }));

      const res = await request(app)
        .get(`/api/providers/user/${user._id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
    });

    it('should return 404 when no provider for user', async () => {
      const { user, token } = setupAuth();
      ServiceProvider.findOne.mockResolvedValue(null);

      const res = await request(app)
        .get(`/api/providers/user/${user._id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(404);
    });
  });
});

// ─── Reviews Tests ──────────────────────────────────────

describe('Reviews Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ────────────────────────────────────────
  // POST /api/reviews
  // ────────────────────────────────────────
  describe('POST /api/reviews', () => {
    it('should create a review for a completed booking', async () => {
      const { user, token } = setupAuth();
      const providerId = objectId();
      const bookingId = objectId();

      const booking = createMockBooking({
        _id: bookingId,
        clientId: user._id,
        providerId,
        status: 'COMPLETED'
      });
      Booking.findById.mockResolvedValue(booking);
      Review.findOne.mockResolvedValue(null); // no existing review
      Review.create.mockResolvedValue({
        _id: objectId(),
        providerId,
        clientId: user._id,
        bookingId,
        clientName: user.name,
        rating: 5,
        comment: 'Great service!',
        createdAt: new Date()
      });
      Review.aggregate.mockResolvedValue([{ _id: providerId, avgRating: 4.5, count: 10 }]);
      ServiceProvider.findByIdAndUpdate.mockResolvedValue({});

      const res = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${token}`)
        .send({
          bookingId: bookingId.toString(),
          providerId: providerId.toString(),
          rating: 5,
          comment: 'Great service!'
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('rating', 5);
    });

    it('should return 400 for non-completed booking', async () => {
      const { user, token } = setupAuth();
      const bookingId = objectId();
      const providerId = objectId();

      Booking.findById.mockResolvedValue(
        createMockBooking({ _id: bookingId, clientId: user._id, status: 'PENDING' })
      );

      const res = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${token}`)
        .send({
          bookingId: bookingId.toString(),
          providerId: providerId.toString(),
          rating: 4
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/completed/i);
    });

    it('should return 400 for duplicate review', async () => {
      const { user, token } = setupAuth();
      const bookingId = objectId();
      const providerId = objectId();

      Booking.findById.mockResolvedValue(
        createMockBooking({ _id: bookingId, clientId: user._id, status: 'COMPLETED' })
      );
      Review.findOne.mockResolvedValue({ _id: objectId() }); // existing review

      const res = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${token}`)
        .send({
          bookingId: bookingId.toString(),
          providerId: providerId.toString(),
          rating: 5
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/already/i);
    });

    it('should return 400 for rating out of range', async () => {
      const { user, token } = setupAuth();

      const res = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${token}`)
        .send({
          bookingId: objectId().toString(),
          providerId: objectId().toString(),
          rating: 10 // too high
        });

      expect(res.status).toBe(400);
    });

    it('should return 403 when reviewing someone else\'s booking', async () => {
      const { token } = setupAuth();
      const bookingId = objectId();
      const providerId = objectId();

      Booking.findById.mockResolvedValue(
        createMockBooking({ _id: bookingId, clientId: objectId(), status: 'COMPLETED' }) // different client
      );

      const res = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${token}`)
        .send({
          bookingId: bookingId.toString(),
          providerId: providerId.toString(),
          rating: 4
        });

      expect(res.status).toBe(403);
    });
  });

  // ────────────────────────────────────────
  // GET /api/reviews/provider/:providerId
  // ────────────────────────────────────────
  describe('GET /api/reviews/provider/:providerId', () => {
    it('should return reviews for a provider', async () => {
      const providerId = objectId();
      Review.find.mockReturnValue({
        sort: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([
            { rating: 5, comment: 'Great!' },
            { rating: 4, comment: 'Good' }
          ])
        })
      });

      const res = await request(app).get(`/api/reviews/provider/${providerId}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('should return 400 for invalid provider ID', async () => {
      const res = await request(app).get('/api/reviews/provider/invalid-id');
      expect(res.status).toBe(400);
    });
  });

  // ────────────────────────────────────────
  // GET /api/reviews/booking/:bookingId
  // ────────────────────────────────────────
  describe('GET /api/reviews/booking/:bookingId', () => {
    it('should check if a review exists for a booking', async () => {
      const { token } = setupAuth();
      const bookingId = objectId();
      Review.findOne.mockResolvedValue(null);

      const res = await request(app)
        .get(`/api/reviews/booking/${bookingId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.reviewed).toBe(false);
    });

    it('should return reviewed: true when review exists', async () => {
      const { token } = setupAuth();
      const bookingId = objectId();
      Review.findOne.mockResolvedValue({ _id: objectId(), rating: 5 });

      const res = await request(app)
        .get(`/api/reviews/booking/${bookingId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.reviewed).toBe(true);
    });
  });
});
