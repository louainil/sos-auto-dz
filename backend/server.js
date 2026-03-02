import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { doubleCsrf } from 'csrf-csrf';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import connectDB from './config/db.js';
import { initSocket } from './config/socket.js';

// Import routes
import authRoutes from './routes/auth.js';
import providerRoutes from './routes/providers.js';
import bookingRoutes from './routes/bookings.js';
import notificationRoutes from './routes/notifications.js';
import adminRoutes from './routes/admin.js';
import reviewRoutes from './routes/reviews.js';
import { devError } from './utils/errors.js';

// Load environment variables (use explicit path for serverless compatibility)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '.env') });

// Fail fast if any required environment variable is missing.
// This prevents the server from starting in a broken state where the first
// request that touches a missing var causes a cryptic runtime crash.
const REQUIRED_ENV_VARS = [
  'JWT_SECRET',
  'MONGODB_URI',
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET',
  'FRONTEND_URL',
  'EMAIL_HOST',
  'EMAIL_USER',
  'EMAIL_PASS',
  'EMAIL_FROM',
];
const missingVars = REQUIRED_ENV_VARS.filter((key) => !process.env[key]);
if (missingVars.length > 0) {
  console.error(`Missing required environment variable(s): ${missingVars.join(', ')}`);
  process.exit(1);
}

const app = express();

// CORS must be first so that ALL responses — including CSRF/auth errors — carry
// the correct Access-Control-* headers. Without this, the browser sees a CORS
// error instead of the real HTTP error, making debugging impossible.
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-csrf-token'],
}));

// Security headers.
// crossOriginResourcePolicy must be 'cross-origin' so that browsers on a
// different subdomain (e.g. Vercel preview URLs) can fetch API responses;
// the default 'same-origin' silently blocks all cross-origin fetches.
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));
app.use(cookieParser());

// CSRF protection — double-submit cookie pattern.
// GET/HEAD/OPTIONS are automatically exempt; all state-mutating requests
// must include the token (from GET /api/csrf-token) as 'x-csrf-token' header.
//
// sameSite: 'none' is required in production because Vercel deploys the
// frontend and backend on different subdomains of vercel.app, which is in
// the Public Suffix List — making them different "sites" from a cookie
// perspective. 'strict' would silently drop all cookies on cross-site requests.
const isProduction = process.env.NODE_ENV === 'production';
const { doubleCsrfProtection, generateToken } = doubleCsrf({
  getSecret: () => process.env.CSRF_SECRET ?? process.env.JWT_SECRET,
  cookieName: isProduction ? '__Host-csrf' : 'csrf',
  cookieOptions: {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    path: '/',
  },
  size: 64,
  getTokenFromRequest: (req) => req.headers['x-csrf-token'],
});
app.use(doubleCsrfProtection);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logger middleware (development)
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
  });
}

// Ensure DB is connected before handling any request
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    res.status(503).json({ message: 'Database connection failed', ...devError(error) });
  }
});

// Rate limiters for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,                   // 5 attempts per window
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many attempts. Please try again after 15 minutes.' },
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,                  // 10 registrations per hour per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many accounts created from this IP. Please try again after an hour.' },
});

// Apply strict rate limiting to sensitive auth endpoints
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/password', authLimiter);
app.use('/api/auth/forgot-password', authLimiter);
app.use('/api/auth/reset-password', authLimiter);
app.use('/api/auth/register', registerLimiter);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/providers', providerRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/reviews', reviewRoutes);

// CSRF token endpoint — GETs are safe; sets the csrf cookie and returns the token.
// The frontend must call this once per session and pass the returned token as
// 'x-csrf-token' on every state-mutating request (POST/PUT/DELETE/PATCH).
app.get('/api/csrf-token', (req, res) => {
  res.json({ csrfToken: generateToken(req, res) });
});

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'SOS Auto DZ API is running' });
});

// Root route
app.get('/', (req, res) => {
  res.json({ 
    message: 'Welcome to SOS Auto DZ API',
    endpoints: {
      auth: '/api/auth',
      providers: '/api/providers',
      bookings: '/api/bookings',
      notifications: '/api/notifications'
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

const PORT = process.env.PORT || 5000;

// Don't start the HTTP server when running as a Vercel serverless function
if (!process.env.VERCEL) {
  const httpServer = createServer(app);
  initSocket(httpServer);
  httpServer.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
  });
}

export default app;
