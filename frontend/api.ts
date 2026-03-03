/// <reference types="vite/client" />
import type { RegisterPayload, ProviderFilters, ProviderUpdatePayload, CreateBookingPayload, BookingUpdatePayload } from './types';

const API_URL = `${import.meta.env.VITE_REACT_APP_BACKEND_BASEURL}`;

// ---------------------------------------------------------------------------
// Token storage — in-memory + sessionStorage fallback for page refresh.
// Tokens are returned in the response body by the backend and sent via
// Authorization header, bypassing cross-origin cookie restrictions.
// ---------------------------------------------------------------------------
let _accessToken: string | null = sessionStorage.getItem('_at');
let _refreshToken: string | null = sessionStorage.getItem('_rt');

const setTokens = (access: string | null, refresh?: string | null) => {
  _accessToken = access;
  if (refresh !== undefined) _refreshToken = refresh;

  if (access) sessionStorage.setItem('_at', access);
  else sessionStorage.removeItem('_at');

  if (refresh) sessionStorage.setItem('_rt', refresh);
  else if (refresh === null) sessionStorage.removeItem('_rt');
};

export const clearTokens = () => { setTokens(null, null); };

// ---------------------------------------------------------------------------
// CSRF token management — HMAC-signed token (cookieless).
// The token is fetched once per page load and cached in memory (not persisted).
// It is sent as the 'x-csrf-token' header on every state-mutating request.
// ---------------------------------------------------------------------------
let _csrfToken: string | null = null;

const getCsrfToken = async (): Promise<string> => {
  if (_csrfToken) return _csrfToken;
  const res = await safeFetch(`${API_URL}/csrf-token`, { credentials: 'include' });
  const { csrfToken } = await res.json();
  _csrfToken = csrfToken as string;
  return _csrfToken;
};

// Call after a 403 so the next mutation re-fetches a fresh token.
const resetCsrfToken = () => { _csrfToken = null; };

const MUTATING_METHODS = new Set(['POST', 'PUT', 'DELETE', 'PATCH']);

// Network-safe fetch with a 15 s timeout.
// • AbortError  → "Request timed out"
// • TypeError   → "Network error. Please check your connection."
const FETCH_TIMEOUT_MS = 15_000;
const safeFetch = async (url: string, options?: RequestInit): Promise<Response> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new Error('Request timed out. Please try again.');
    }
    throw new Error('Network error. Please check your connection.');
  } finally {
    clearTimeout(timeoutId);
  }
};

// Helper function to handle API responses
const handleResponse = async (response: Response) => {
  const text = await response.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(response.ok ? 'Invalid server response' : `Server error (${response.status})`);
  }
  if (!response.ok) {
    throw new Error(data.message || 'Something went wrong');
  }
  return data;
};

// Attempt to silently refresh the access token.
// Sends refresh token from memory/sessionStorage in the body AND via cookie.
// Stores the new tokens returned by the backend.
const attemptTokenRefresh = async (): Promise<boolean> => {
  try {
    const csrfToken = await getCsrfToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'x-csrf-token': csrfToken,
    };
    if (_accessToken) headers['Authorization'] = `Bearer ${_accessToken}`;
    const res = await safeFetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
      headers,
      body: JSON.stringify({ refreshToken: _refreshToken }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.accessToken) setTokens(data.accessToken, data.refreshToken ?? _refreshToken);
      return true;
    }
    return false;
  } catch {
    return false;
  }
};

// Authenticated fetch: sends credentials (HttpOnly cookies) + Authorization header,
// retries once after a silent token refresh on 401.
// Automatically adds the CSRF token header for state-mutating methods.
// Also retries once on 403 with a fresh CSRF token (stale token recovery).
const authFetch = async (url: string, options: RequestInit = {}): Promise<Response> => {
  const method = (options.method ?? 'GET').toUpperCase();
  const isMutating = MUTATING_METHODS.has(method);
  const isFormData = options.body instanceof FormData;

  const buildHeaders = async (): Promise<Record<string, string>> => {
    const csrfToken = isMutating ? await getCsrfToken() : null;
    return {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...(options.headers as Record<string, string> || {}),
      ...(csrfToken ? { 'x-csrf-token': csrfToken } : {}),
      ...(_accessToken ? { 'Authorization': `Bearer ${_accessToken}` } : {}),
    };
  };

  let headers = await buildHeaders();
  let response = await safeFetch(url, { ...options, credentials: 'include', headers });

  if (response.status === 401) {
    const refreshed = await attemptTokenRefresh();
    if (refreshed) {
      headers = await buildHeaders(); // rebuild to pick up new access token
      response = await safeFetch(url, { ...options, credentials: 'include', headers });
    }
  } else if (response.status === 403 && isMutating) {
    // CSRF token may be stale — reset, get a fresh one, and retry once.
    resetCsrfToken();
    headers = await buildHeaders();
    response = await safeFetch(url, { ...options, credentials: 'include', headers });
  }

  return response;
};

// Helper: perform a CSRF-protected mutation with one automatic retry.
// If the server returns 403 (stale/invalid CSRF token) we reset the
// cached token, fetch a fresh one, and replay the request once.
const csrfFetch = async (
  url: string,
  options: RequestInit = {},
): Promise<Response> => {
  const attempt = async () => {
    const csrfToken = await getCsrfToken();
    const isFormData = options.body instanceof FormData;
    const headers: Record<string, string> = {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...(options.headers as Record<string, string> || {}),
      'x-csrf-token': csrfToken,
    };
    return safeFetch(url, { ...options, credentials: 'include', headers });
  };
  let response = await attempt();
  if (response.status === 403) {
    // Token may be stale — reset and retry once with a fresh token.
    resetCsrfToken();
    response = await attempt();
  }
  return response;
};

// Auth API
export const authAPI = {
  register: async (userData: RegisterPayload) => {
    const response = await csrfFetch(`${API_URL}/auth/register`, {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    return handleResponse(response);
  },

  login: async (email: string, password: string) => {
    const response = await csrfFetch(`${API_URL}/auth/login`, {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    const data = await handleResponse(response);
    // Store tokens for cross-origin auth fallback
    if (data.accessToken) setTokens(data.accessToken, data.refreshToken);
    return data;
  },

  logout: async () => {
    try {
      await csrfFetch(`${API_URL}/auth/logout`, { method: 'POST' });
      resetCsrfToken();
    } catch { /* ignore network errors on logout */ }
    clearTokens();
  },

  getCurrentUser: async () => {
    const response = await authFetch(`${API_URL}/auth/me`);
    return handleResponse(response);
  },

  uploadAvatar: async (file: File) => {
    const formData = new FormData();
    formData.append('avatar', file);
    const response = await authFetch(`${API_URL}/auth/avatar`, {
      method: 'POST',
      body: formData
    });
    return handleResponse(response);
  },

  updateProfile: async (data: { name?: string; phone?: string }) => {
    const response = await authFetch(`${API_URL}/auth/profile`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
    return handleResponse(response);
  },

  changePassword: async (data: { currentPassword: string; newPassword: string }) => {
    const response = await authFetch(`${API_URL}/auth/password`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
    return handleResponse(response);
  },

  deleteAccount: async (password: string) => {
    const response = await authFetch(`${API_URL}/auth/account`, {
      method: 'DELETE',
      body: JSON.stringify({ password }),
    });
    return handleResponse(response);
  },

  forgotPassword: async (email: string) => {
    const response = await csrfFetch(`${API_URL}/auth/forgot-password`, {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
    return handleResponse(response);
  },

  resetPassword: async (token: string, email: string, newPassword: string) => {
    const response = await csrfFetch(`${API_URL}/auth/reset-password`, {
      method: 'POST',
      body: JSON.stringify({ token, email, newPassword }),
    });
    return handleResponse(response);
  },

  verifyEmail: async (token: string, email: string) => {
    const response = await safeFetch(`${API_URL}/auth/verify-email?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`);
    return handleResponse(response);
  },

  resendVerification: async (email: string) => {
    const response = await csrfFetch(`${API_URL}/auth/resend-verification`, {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
    return handleResponse(response);
  }
};

// Providers API
export const providersAPI = {
  getAll: async (filters?: ProviderFilters) => {
    const params = new URLSearchParams();
    if (filters) {
      Object.keys(filters).forEach(key => {
        if (filters[key] !== undefined && filters[key] !== 'all') {
          params.append(key, String(filters[key]));
        }
      });
    }
    const response = await safeFetch(`${API_URL}/providers?${params}`);
    return handleResponse(response);
  },

  getById: async (id: string) => {
    const response = await safeFetch(`${API_URL}/providers/${id}`);
    return handleResponse(response);
  },

  update: async (id: string, data: ProviderUpdatePayload) => {
    const response = await authFetch(`${API_URL}/providers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
    return handleResponse(response);
  },

  getByUserId: async (userId: string) => {
    const response = await authFetch(`${API_URL}/providers/user/${userId}`);
    return handleResponse(response);
  },

  uploadImage: async (id: string, file: File) => {
    const formData = new FormData();
    formData.append('image', file);
    const response = await authFetch(`${API_URL}/providers/${id}/image`, {
      method: 'POST',
      body: formData
    });
    return handleResponse(response);
  },

  uploadGalleryImages: async (id: string, files: File[]) => {
    const formData = new FormData();
    files.forEach(f => formData.append('images', f));
    const response = await authFetch(`${API_URL}/providers/${id}/gallery`, {
      method: 'POST',
      body: formData
    });
    return handleResponse(response);
  },

  deleteGalleryImage: async (id: string, publicId: string) => {
    const encoded = publicId.replace(/\//g, '--');
    const response = await authFetch(`${API_URL}/providers/${id}/gallery/${encoded}`, {
      method: 'DELETE'
    });
    return handleResponse(response);
  }
};

// Bookings API
export const bookingsAPI = {
  create: async (bookingData: CreateBookingPayload) => {
    const response = await authFetch(`${API_URL}/bookings`, {
      method: 'POST',
      body: JSON.stringify(bookingData)
    });
    return handleResponse(response);
  },

  getAll: async () => {
    const response = await authFetch(`${API_URL}/bookings`);
    return handleResponse(response);
  },

  getById: async (id: string) => {
    const response = await authFetch(`${API_URL}/bookings/${id}`);
    return handleResponse(response);
  },

  update: async (id: string, data: BookingUpdatePayload) => {
    const response = await authFetch(`${API_URL}/bookings/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
    return handleResponse(response);
  },

  /** Soft-cancels a booking (sets status to CANCELLED). Preserves history. */
  delete: async (id: string, cancellationReason?: string) => {
    const response = await authFetch(`${API_URL}/bookings/${id}`, {
      method: 'DELETE',
      body: cancellationReason ? JSON.stringify({ cancellationReason }) : undefined
    });
    return handleResponse(response);
  }
};

// Notifications API
export const notificationsAPI = {
  getAll: async () => {
    const response = await authFetch(`${API_URL}/notifications`);
    return handleResponse(response);
  },

  markAsRead: async (id: string) => {
    const response = await authFetch(`${API_URL}/notifications/${id}/read`, {
      method: 'PUT'
    });
    return handleResponse(response);
  },

  delete: async (id: string) => {
    const response = await authFetch(`${API_URL}/notifications/${id}`, {
      method: 'DELETE'
    });
    return handleResponse(response);
  },

  clearAll: async () => {
    const response = await authFetch(`${API_URL}/notifications`, {
      method: 'DELETE'
    });
    return handleResponse(response);
  },

  markAllRead: async () => {
    const response = await authFetch(`${API_URL}/notifications/read-all`, {
      method: 'PUT'
    });
    return handleResponse(response);
  }
};

// Public Stats API
export const publicStatsAPI = {
  get: async () => {
    const response = await safeFetch(`${API_URL}/providers/stats`);
    return handleResponse(response);
  }
};

// Reviews API
export const reviewsAPI = {
  create: async (data: { bookingId: string; providerId: string; rating: number; comment?: string }) => {
    const response = await authFetch(`${API_URL}/reviews`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
    return handleResponse(response);
  },

  getByProvider: async (providerId: string) => {
    const response = await safeFetch(`${API_URL}/reviews/provider/${providerId}`);
    return handleResponse(response);
  },

  checkBooking: async (bookingId: string) => {
    const response = await authFetch(`${API_URL}/reviews/booking/${bookingId}`);
    return handleResponse(response);
  }
};

// Admin API
export const adminAPI = {
  getStats: async () => {
    const response = await authFetch(`${API_URL}/admin/stats`);
    return handleResponse(response);
  },

  getPendingProviders: async () => {
    const response = await authFetch(`${API_URL}/admin/providers/pending`);
    return handleResponse(response);
  },

  approveProvider: async (id: string) => {
    const response = await authFetch(`${API_URL}/admin/providers/${id}/approve`, {
      method: 'PUT'
    });
    return handleResponse(response);
  },

  rejectProvider: async (id: string, rejectionReason: string) => {
    const response = await authFetch(`${API_URL}/admin/providers/${id}/reject`, {
      method: 'PUT',
      body: JSON.stringify({ rejectionReason }),
    });
    return handleResponse(response);
  },

  getUsers: async (search?: string, page = 1, limit = 20) => {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (search) params.set('search', search);
    const response = await authFetch(`${API_URL}/admin/users?${params}`);
    return handleResponse(response);
  },

  getAllProviders: async (status?: string, page = 1, limit = 20) => {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (status) params.set('status', status);
    const response = await authFetch(`${API_URL}/admin/providers?${params}`);
    return handleResponse(response);
  },

  getAllBookings: async (page = 1, limit = 20, status?: string) => {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (status) params.set('status', status);
    const response = await authFetch(`${API_URL}/admin/bookings?${params}`);
    return handleResponse(response);
  },

  banUser: async (id: string, isBanned: boolean) => {
    const response = await authFetch(`${API_URL}/admin/users/${id}/ban`, {
      method: 'PUT',
      body: JSON.stringify({ isBanned }),
    });
    return handleResponse(response);
  },
};
