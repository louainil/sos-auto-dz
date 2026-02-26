/// <reference types="vite/client" />
const API_URL = `${import.meta.env.VITE_REACT_APP_BACKEND_BASEURL}`;

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` })
  };
};

// Helper function to handle API responses
const handleResponse = async (response: Response) => {
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Something went wrong');
  }
  return data;
};

// Auth API
export const authAPI = {
  register: async (userData: any) => {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    const data = await handleResponse(response);
    if (data.token) {
      localStorage.setItem('token', data.token);
    }
    return data;
  },

  login: async (email: string, password: string) => {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await handleResponse(response);
    if (data.token) {
      localStorage.setItem('token', data.token);
    }
    return data;
  },

  logout: () => {
    localStorage.removeItem('token');
  },

  getCurrentUser: async () => {
    const response = await fetch(`${API_URL}/auth/me`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  uploadAvatar: async (file: File) => {
    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('avatar', file);
    const response = await fetch(`${API_URL}/auth/avatar`, {
      method: 'POST',
      headers: { ...(token && { Authorization: `Bearer ${token}` }) },
      body: formData
    });
    return handleResponse(response);
  },

  updateProfile: async (data: { name?: string; phone?: string }) => {
    const response = await fetch(`${API_URL}/auth/profile`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(response);
  },

  changePassword: async (data: { currentPassword: string; newPassword: string }) => {
    const response = await fetch(`${API_URL}/auth/password`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(response);
  },

  forgotPassword: async (email: string) => {
    const response = await fetch(`${API_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    return handleResponse(response);
  },

  resetPassword: async (token: string, email: string, newPassword: string) => {
    const response = await fetch(`${API_URL}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, email, newPassword })
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
    const response = await fetch(`${API_URL}/providers/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(response);
  },

  getByUserId: async (userId: string) => {
    const response = await fetch(`${API_URL}/providers/user/${userId}`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  }
};

// Bookings API
export const bookingsAPI = {
  create: async (bookingData: any) => {
    const response = await fetch(`${API_URL}/bookings`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(bookingData)
    });
    return handleResponse(response);
  },

  getAll: async () => {
    const response = await fetch(`${API_URL}/bookings`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  getById: async (id: string) => {
    const response = await fetch(`${API_URL}/bookings/${id}`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  update: async (id: string, data: any) => {
    const response = await fetch(`${API_URL}/bookings/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(response);
  },

  delete: async (id: string) => {
    const response = await fetch(`${API_URL}/bookings/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  }
};

// Notifications API
export const notificationsAPI = {
  getAll: async () => {
    const response = await fetch(`${API_URL}/notifications`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  markAsRead: async (id: string) => {
    const response = await fetch(`${API_URL}/notifications/${id}/read`, {
      method: 'PUT',
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  delete: async (id: string) => {
    const response = await fetch(`${API_URL}/notifications/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  clearAll: async () => {
    const response = await fetch(`${API_URL}/notifications`, {
      method: 'DELETE',
      headers: getAuthHeaders()
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

// Admin API
export const adminAPI = {
  getStats: async () => {
    const response = await fetch(`${API_URL}/admin/stats`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  getPendingProviders: async () => {
    const response = await fetch(`${API_URL}/admin/providers/pending`, {
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  },

  approveProvider: async (id: string) => {
    const response = await fetch(`${API_URL}/admin/providers/${id}/approve`, {
      method: 'PUT',
      headers: getAuthHeaders()
    });
    return handleResponse(response);
  }
};
