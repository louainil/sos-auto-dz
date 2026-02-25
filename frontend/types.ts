
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
  image: string;
  isAvailable: boolean; // Manual override for "Unavailable" (e.g. on vacation)
  workingDays: number[]; // 0=Sun, 1=Mon, ..., 6=Sat
  workingHours: {
    start: string; // "09:00"
    end: string;   // "17:00"
  };
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
