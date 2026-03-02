/// <reference types="vite/client" />
const API_URL = `${import.meta.env.VITE_REACT_APP_BACKEND_BASEURL}`;

// ---------------------------------------------------------------------------
// CSRF token management — double-submit cookie pattern.
// The token is fetched once per page load and cached in memory (not persisted).
// It is sent as the 'x-csrf-token' header on every state-mutating request.
// ---------------------------------------------------------------------------
let _csrfToken: string | null = null;

const getCsrfToken = async (): Promise<string> => {
  if (_csrfToken) return _csrfToken;
  const res = await fetch(`${API_URL}/csrf-token`, { credentials: 'include' });
  const { csrfToken } = await res.json();
  _csrfToken = csrfToken as string;
  return _csrfToken;
};

// Call after a 403 so the next mutation re-fetches a fresh token.
const resetCsrfToken = () => { _csrfToken = null; };

const MUTATING_METHODS = new Set(['POST', 'PUT', 'DELETE', 'PATCH']);

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

// Attempt to silently refresh the access token using the HttpOnly refresh cookie.
// The new access token is set as a cookie by the server — no localStorage involved.
// Includes the CSRF token because the refresh endpoint is a POST.
const attemptTokenRefresh = async (): Promise<boolean> => {
  try {
    const csrfToken = await getCsrfToken();
    const res = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'x-csrf-token': csrfToken },
    });
    return res.ok;
  } catch {
    return false;
  }
};

// Authenticated fetch: sends credentials (HttpOnly cookies) automatically,
// retries once after a silent token refresh on 401.
// Automatically adds the CSRF token header for state-mutating methods.
const authFetch = async (url: string, options: RequestInit = {}): Promise<Response> => {
  const method = (options.method ?? 'GET').toUpperCase();
  const isMutating = MUTATING_METHODS.has(method);
  const csrfToken = isMutating ? await getCsrfToken() : null;
  const isFormData = options.body instanceof FormData;
  const headers: Record<string, string> = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(options.headers as Record<string, string> || {}),
    ...(csrfToken ? { 'x-csrf-token': csrfToken } : {}),
  };
  let response = await fetch(url, { ...options, credentials: 'include', headers });
  if (response.status === 401) {
    const refreshed = await attemptTokenRefresh();
    if (refreshed) {
      response = await fetch(url, { ...options, credentials: 'include', headers });
    }
  }
  // A 403 may indicate an expired/invalid CSRF token — reset so the next call re-fetches.
  if (response.status === 403) resetCsrfToken();
  return response;
};

// Auth API
export const authAPI = {
  register: async (userData: any) => {
    const csrfToken = await getCsrfToken();
    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', 'x-csrf-token': csrfToken },
      body: JSON.stringify(userData)
    });
    return handleResponse(response);
  },

  login: async (email: string, password: string) => {
    const csrfToken = await getCsrfToken();
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', 'x-csrf-token': csrfToken },
      body: JSON.stringify({ email, password })
    });
    return handleResponse(response);
  },

  logout: async () => {
    try {
      const csrfToken = await getCsrfToken();
      await fetch(`${API_URL}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'x-csrf-token': csrfToken },
      });
      resetCsrfToken();
    } catch { /* ignore network errors on logout */ }
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

  forgotPassword: async (email: string) => {
    const csrfToken = await getCsrfToken();
    const response = await fetch(`${API_URL}/auth/forgot-password`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', 'x-csrf-token': csrfToken },
      body: JSON.stringify({ email })
    });
    return handleResponse(response);
  },

  resetPassword: async (token: string, email: string, newPassword: string) => {
    const csrfToken = await getCsrfToken();
    const response = await fetch(`${API_URL}/auth/reset-password`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', 'x-csrf-token': csrfToken },
      body: JSON.stringify({ token, email, newPassword })
    });
    return handleResponse(response);
  },

  verifyEmail: async (token: string, email: string) => {
    const response = await fetch(`${API_URL}/auth/verify-email?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`);
    return handleResponse(response);
  },

  resendVerification: async (email: string) => {
    const csrfToken = await getCsrfToken();
    const response = await fetch(`${API_URL}/auth/resend-verification`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', 'x-csrf-token': csrfToken },
      body: JSON.stringify({ email })
    });
    return handleResponse(response);
  }
};

// Providers API
export const providersAPI = {
  getAll: async (filters?: any) => {
    const params = new URLSearchParams();
    if (filters) {
      Object.keys(filters).forEach(key => {
        if (filters[key] !== undefined && filters[key] !== 'all') {
          params.append(key, filters[key]);
        }
      });
    }
    const response = await fetch(`${API_URL}/providers?${params}`);
    return handleResponse(response);
  },

  getById: async (id: string) => {
    const response = await fetch(`${API_URL}/providers/${id}`);
    return handleResponse(response);
  },

  update: async (id: string, data: any) => {
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
  create: async (bookingData: any) => {
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

  update: async (id: string, data: any) => {
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
    const response = await fetch(`${API_URL}/providers/stats`);
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
    const response = await fetch(`${API_URL}/reviews/provider/${providerId}`);
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
  }
};
