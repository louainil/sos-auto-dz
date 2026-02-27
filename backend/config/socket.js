import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';

let io = null;

/**
 * Initialize Socket.io on the given HTTP server.
 * Authenticates connections via JWT token sent in auth.token handshake.
 */
export function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || '*',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  // Authenticate socket connections using JWT
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) {
      return next(new Error('Authentication required'));
    }
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      next();
    } catch {
      return next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    // Join a personal room keyed by the user's ID so we can target them
    if (socket.userId) {
      socket.join(`user:${socket.userId}`);
    }

    socket.on('disconnect', () => {
      // cleanup handled automatically by Socket.io
    });
  });

  return io;
}

/**
 * Return the current Socket.io instance.
 * Returns null when running in serverless (Vercel) where sockets aren't initialised.
 */
export function getIO() {
  return io;
}

/**
 * Emit a notification event to a specific user.
 * Silently no-ops if Socket.io is not initialised (serverless fallback).
 */
export function emitNotification(userId, notification) {
  if (!io) return;
  io.to(`user:${userId.toString()}`).emit('notification', notification);
}
