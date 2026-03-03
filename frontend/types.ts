
export enum UserRole {
  CLIENT = 'CLIENT',
  MECHANIC = 'MECHANIC', // Represents Garage Professionals
  PARTS_SHOP = 'PARTS_SHOP',
  TOWING = 'TOWING',
  ADMIN = 'ADMIN'
}

export type GarageType = 'MECHANIC' | 'ELECTRICIAN' | 'AUTO_BODY';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  // Professional specific fields
  garageType?: GarageType;
  wilayaId?: number;
  commune?: string;
  isAvailable?: boolean;
  avatar?: { url: string; publicId: string };
  isEmailVerified?: boolean;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';
  isRead: boolean;
  createdAt: Date;
}

export interface Wilaya {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
}

export interface ServiceItem {
  name: string;
  price: number;
}

export interface ServiceProvider {
  id: string;
  name: string;
  role: UserRole;
  garageType?: GarageType; // Specific to MECHANIC role
  wilayaId: number;
  commune: string;
  description: string;
  rating: number;
  phone: string;
  specialty?: string[]; // Supported Car Brands
  /** Main shop/garage photo uploaded via the provider image endpoint */
  profileImage: string;
  /** Cloudinary-managed gallery of up to 8 photos */
  images?: { url: string; publicId: string }[];
  isAvailable: boolean; // Manual override for "Unavailable" (e.g. on vacation)
  workingDays: number[]; // 0=Sun, 1=Mon, ..., 6=Sat
  workingHours: {
    start: string; // "09:00"
    end: string;   // "17:00"
  };
  services?: ServiceItem[];
}

export interface Booking {
  id: string;
  providerId: string;
  providerName: string;
  providerPhone?: string;
  clientId: string;
  clientName: string;
  clientPhone: string;
  date: string;
  issue: string;
  status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
  cancellationReason?: string;
  price?: number;
}

// ---------------------------------------------------------------------------
// API request payload types
// ---------------------------------------------------------------------------

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  phone?: string;
  garageType?: GarageType;
  wilayaId?: number;
  commune?: string;
  description?: string;
  specialty?: string[];
  workingDays?: number[];
  workingHours?: { start: string; end: string };
}

export interface ProviderFilters {
  role?: string;
  wilayaId?: string | number;
  commune?: string;
  garageType?: string;
  specialty?: string;
  search?: string;
  [key: string]: string | number | undefined;
}

export interface ProviderUpdatePayload {
  isAvailable?: boolean;
  workingDays?: number[];
  workingHours?: { start: string; end: string };
  name?: string;
  phone?: string;
  description?: string;
  specialty?: string[];
  garageType?: GarageType;
  wilayaId?: number;
  commune?: string;
  services?: ServiceItem[];
}

export interface CreateBookingPayload {
  providerId: string;
  date: string;
  issue: string;
}

export interface BookingUpdatePayload {
  status?: 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
  cancellationReason?: string;
  price?: number;
}

export enum PageView {
  HOME = 'HOME',
  GARAGE = 'GARAGE',
  PARTS = 'PARTS',
  TOWING = 'TOWING',
  LOGIN = 'LOGIN',
  DASHBOARD = 'DASHBOARD'
}
