/**
 * Returns `{ error: err.message }` in development, empty object in production.
 * Spread into res.json() payloads to avoid leaking internals in prod:
 *   res.status(500).json({ message: 'Server error', ...devError(error) });
 */
export const devError = (err) =>
  process.env.NODE_ENV === 'development' ? { error: err.message } : {};
