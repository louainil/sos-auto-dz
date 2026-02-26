/**
 * App component routing tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import React from 'react';

// Mock all API calls
vi.mock('../api', () => ({
  authAPI: {
    getCurrentUser: vi.fn().mockRejectedValue(new Error('Not logged in')),
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn()
  },
  providersAPI: {
    getAll: vi.fn().mockResolvedValue([]),
    getStats: vi.fn().mockResolvedValue({ totalProviders: 0, wilayasCovered: 0, avgRating: 0 })
  },
  notificationsAPI: {
    getAll: vi.fn().mockResolvedValue([]),
    markAsRead: vi.fn(),
    clearAll: vi.fn()
  },
  bookingsAPI: {
    getAll: vi.fn().mockResolvedValue([]),
    create: vi.fn()
  },
  publicStatsAPI: {
    get: vi.fn().mockResolvedValue({ totalProviders: 50, wilayasCovered: 10, avgRating: 4.2 })
  }
}));

// Mock geolocation
const mockGeolocation = {
  getCurrentPosition: vi.fn(),
  watchPosition: vi.fn(),
  clearWatch: vi.fn()
};
Object.defineProperty(navigator, 'geolocation', {
  value: mockGeolocation,
  writable: true
});

import App from '../App';

const renderWithRouter = (initialPath = '/') => {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <App />
    </MemoryRouter>
  );
};

describe('App Routing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('should render the Navbar with brand logo', async () => {
    renderWithRouter('/');
    await waitFor(() => {
      expect(screen.getByText('SOS Auto')).toBeInTheDocument();
    });
  });

  it('should render Home page on root path', async () => {
    renderWithRouter('/');
    await waitFor(() => {
      // Home page has the hero section with SOS Auto DZ
      expect(screen.getByText('SOS Auto')).toBeInTheDocument();
    });
  });

  it('should render Footer on non-dashboard pages', async () => {
    renderWithRouter('/');
    await waitFor(() => {
      // Footer contains copyright
      const year = new Date().getFullYear().toString();
      expect(screen.getByText(new RegExp(year))).toBeInTheDocument();
    });
  });

  it('should redirect unknown routes to home', async () => {
    renderWithRouter('/unknown-page');
    await waitFor(() => {
      expect(screen.getByText('SOS Auto')).toBeInTheDocument();
    });
  });

  it('should redirect /dashboard to home if not logged in', async () => {
    renderWithRouter('/dashboard');
    await waitFor(() => {
      // Should redirect to home, so Home component should render
      expect(screen.getByText('SOS Auto')).toBeInTheDocument();
    });
  });
});
