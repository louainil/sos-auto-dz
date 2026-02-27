/**
 * ServiceCard component tests
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import React from 'react';
import ServiceCard from '../components/ServiceCard';
import { ServiceProvider, UserRole } from '../types';

// Mock DistanceIndicator — it depends on geolocation logic
vi.mock('../components/DistanceIndicator', () => ({
  default: () => <span data-testid="distance-indicator">~10 km</span>
}));

const createProvider = (overrides: Partial<ServiceProvider> = {}): ServiceProvider => ({
  id: '1',
  name: 'Test Garage',
  role: UserRole.MECHANIC,
  garageType: 'MECHANIC',
  wilayaId: 16,
  commune: 'Alger Centre',
  description: 'Professional mechanic service for all vehicle types',
  rating: 4.5,
  phone: '0555123456',
  specialty: ['Toyota', 'Peugeot'],
  image: '',
  isAvailable: true,
  workingDays: [0, 1, 2, 3, 4, 6],
  workingHours: { start: '08:00', end: '17:00' },
  ...overrides
});

describe('ServiceCard', () => {
  const defaultProps = {
    provider: createProvider(),
    userLocation: null,
    onBook: vi.fn(),
    language: 'en' as const
  };

  const renderCard = (props: Partial<typeof defaultProps> = {}) =>
    render(<MemoryRouter><ServiceCard {...defaultProps} {...props} /></MemoryRouter>);

  it('should render provider name', () => {
    renderCard();
    expect(screen.getByText('Test Garage')).toBeInTheDocument();
  });

  it('should render provider description', () => {
    renderCard();
    expect(screen.getByText(/professional mechanic service/i)).toBeInTheDocument();
  });

  it('should render the provider role badge', () => {
    renderCard();
    expect(screen.getByText('MECHANIC')).toBeInTheDocument();
  });

  it('should render specialties', () => {
    renderCard();
    expect(screen.getByText('Toyota')).toBeInTheDocument();
    expect(screen.getByText('Peugeot')).toBeInTheDocument();
  });

  it('should render working hours', () => {
    renderCard();
    expect(screen.getByText(/08:00 - 17:00/)).toBeInTheDocument();
  });

  it('should render commune and wilaya location', () => {
    renderCard();
    expect(screen.getByText(/alger centre/i)).toBeInTheDocument();
  });

  it('should show "Book Now" button for MECHANIC providers', () => {
    renderCard();
    const bookBtn = screen.getByRole('button', { name: /book now/i });
    expect(bookBtn).toBeInTheDocument();
  });

  it('should call onBook when Book Now button is clicked', () => {
    const onBook = vi.fn();
    renderCard({ onBook });
    
    const bookBtn = screen.getByRole('button', { name: /book now/i });
    fireEvent.click(bookBtn);
    
    expect(onBook).toHaveBeenCalledWith(defaultProps.provider);
  });

  it('should show "Call Now" for TOWING providers instead of Book Now', () => {
    const provider = createProvider({ role: UserRole.TOWING });
    renderCard({ provider });
    
    expect(screen.getByText(/call now/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /book now/i })).toBeNull();
  });

  it('should show "Call Now" for PARTS_SHOP providers instead of Book Now', () => {
    const provider = createProvider({ role: UserRole.PARTS_SHOP });
    renderCard({ provider });
    
    expect(screen.getByText(/call now/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /book now/i })).toBeNull();
  });

  it('should show WhatsApp link with correct Algeria phone format for TOWING', () => {
    const provider = createProvider({ role: UserRole.TOWING, phone: '0555123456' });
    renderCard({ provider });
    
    const links = screen.getAllByRole('link');
    const waLink = links.find(l => l.getAttribute('href')?.includes('wa.me'));
    expect(waLink).toBeDefined();
    expect(waLink?.getAttribute('href')).toContain('wa.me/213555123456');
  });

  it('should show unavailable overlay when provider is not available', () => {
    const provider = createProvider({ isAvailable: false });
    renderCard({ provider });
    
    expect(screen.getByText(/currently unavailable/i)).toBeInTheDocument();
  });

  it('should disable book button when provider is unavailable', () => {
    const provider = createProvider({ isAvailable: false });
    renderCard({ provider });
    
    const bookBtn = screen.getByRole('button', { name: /book now/i });
    expect(bookBtn).toBeDisabled();
  });

  it('should render Towing card with truck icon placeholder (no image)', () => {
    const provider = createProvider({ role: UserRole.TOWING });
    renderCard({ provider });
    
    // Towing has a gradient placeholder, no <img>
    expect(screen.queryByRole('img')).toBeNull();
  });

  it('should show PARTS_SHOP role badge for parts providers', () => {
    const provider = createProvider({ role: UserRole.PARTS_SHOP });
    renderCard({ provider });
    
    expect(screen.getByText('PARTS SHOP')).toBeInTheDocument();
  });

  it('should render in French when language is fr', () => {
    renderCard({ language: 'fr' });
    // Book Now in French
    expect(screen.getByRole('button', { name: /réserver/i })).toBeInTheDocument();
  });
});
