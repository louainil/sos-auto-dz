/**
 * Footer component tests
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import React from 'react';
import Footer from '../components/Footer';
import { PageView } from '../types';

const renderWithRouter = (ui: React.ReactElement) =>
  render(<MemoryRouter>{ui}</MemoryRouter>);

describe('Footer', () => {
  const defaultProps = {
    language: 'en' as const,
    onChangeView: vi.fn()
  };

  it('should render the brand name', () => {
    renderWithRouter(<Footer {...defaultProps} />);
    expect(screen.getByText('SOS Auto DZ')).toBeInTheDocument();
  });

  it('should render service navigation links', () => {
    renderWithRouter(<Footer {...defaultProps} />);
    expect(screen.getByRole('button', { name: /garage services/i })).toBeInTheDocument();
  });

  it('should call onChangeView when garage link is clicked', () => {
    const onChangeView = vi.fn();
    renderWithRouter(<Footer {...defaultProps} onChangeView={onChangeView} />);
    
    const garageButton = screen.getByRole('button', { name: /garage services/i });
    fireEvent.click(garageButton);
    
    expect(onChangeView).toHaveBeenCalledWith(PageView.GARAGE);
  });

  it('should call onChangeView with PARTS when spare parts link is clicked', () => {
    const onChangeView = vi.fn();
    renderWithRouter(<Footer {...defaultProps} onChangeView={onChangeView} />);
    
    const partsButton = screen.getByRole('button', { name: /spare parts/i });
    fireEvent.click(partsButton);
    
    expect(onChangeView).toHaveBeenCalledWith(PageView.PARTS);
  });

  it('should call onChangeView with TOWING when towing link is clicked', () => {
    const onChangeView = vi.fn();
    renderWithRouter(<Footer {...defaultProps} onChangeView={onChangeView} />);
    
    const towingButton = screen.getByRole('button', { name: /towing/i });
    fireEvent.click(towingButton);
    
    expect(onChangeView).toHaveBeenCalledWith(PageView.TOWING);
  });

  it('should render contact information', () => {
    renderWithRouter(<Footer {...defaultProps} />);
    expect(screen.getByText(/nedjari088@gmail.com/)).toBeInTheDocument();
    expect(screen.getByText(/791 34 16 41/)).toBeInTheDocument();
  });

  it('should render the current year in copyright', () => {
    renderWithRouter(<Footer {...defaultProps} />);
    const year = new Date().getFullYear().toString();
    expect(screen.getByText(new RegExp(year))).toBeInTheDocument();
  });

  it('should render social media links', () => {
    renderWithRouter(<Footer {...defaultProps} />);
    const links = screen.getAllByRole('link');
    const socialLinks = links.filter(l => 
      l.getAttribute('href')?.includes('instagram') ||
      l.getAttribute('href')?.includes('github') ||
      l.getAttribute('href')?.includes('x.com')
    );
    expect(socialLinks.length).toBeGreaterThanOrEqual(2);
  });

  it('should render in French when language is fr', () => {
    renderWithRouter(<Footer {...defaultProps} language="fr" />);
    // French translations should be used
    expect(screen.getByText(/droits réservés/i)).toBeInTheDocument();
  });
});
