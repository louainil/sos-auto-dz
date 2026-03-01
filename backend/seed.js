import mongoose from 'mongoose';
import dotenv from 'dotenv';
import ServiceProvider from './models/ServiceProvider.js';
import User from './models/User.js';
import connectDB from './config/db.js';

dotenv.config();

// Sample data to seed
const sampleProviders = [
  {
    name: 'Garage Expert Auto',
    role: 'MECHANIC',
    garageType: 'MECHANIC',
    wilayaId: 16,
    commune: 'Hydra',
    description: 'Specialist in German cars. Full diagnostics and engine repair.',
    rating: 4.8,
    totalReviews: 34,
    phone: '0550123456',
    specialty: ['BMW', 'Volkswagen', 'Audi', 'Mercedes-Benz'],
    isAvailable: true,
    workingDays: [0, 1, 2, 3, 4, 6],
    workingHours: { start: '08:00', end: '17:00' }
  },
  {
    name: 'Rapid Towing Oran',
    role: 'TOWING',
    wilayaId: 31,
    commune: 'Es Senia',
    description: '24/7 Breakdown assistance across Oran wilaya.',
    rating: 4.9,
    totalReviews: 58,
    phone: '0770987654',
    isAvailable: true,
    workingDays: [0, 1, 2, 3, 4, 5, 6],
    workingHours: { start: '00:00', end: '23:59' }
  },
  {
    name: 'Sétif Spare Parts',
    role: 'PARTS_SHOP',
    wilayaId: 19,
    commune: 'El Eulma',
    description: 'Original parts for all brands. Wholesale and retail.',
    rating: 4.5,
    totalReviews: 21,
    phone: '0661234567',
    specialty: ['Toyota', 'Hyundai', 'Renault', 'Dacia', 'Kia'],
    isAvailable: true,
    workingDays: [6, 0, 1, 2, 3, 4],
    workingHours: { start: '08:30', end: '18:00' }
  },
  {
    name: 'Quick Fix Constantine',
    role: 'MECHANIC',
    garageType: 'MECHANIC',
    wilayaId: 25,
    commune: 'El Khroub',
    description: 'General mechanical repairs and oil change.',
    rating: 4.2,
    totalReviews: 13,
    phone: '0555112233',
    specialty: ['Peugeot', 'Renault', 'Citroën'],
    isAvailable: false,
    workingDays: [0, 1, 2, 3, 4],
    workingHours: { start: '09:00', end: '16:00' }
  },
  {
    name: 'Sahara Assistance',
    role: 'TOWING',
    wilayaId: 30,
    commune: 'Hassi Messaoud',
    description: 'Desert rescue and heavy towing.',
    rating: 5.0,
    totalReviews: 9,
    phone: '0660000000',
    isAvailable: true,
    workingDays: [0, 1, 2, 3, 4, 5, 6],
    workingHours: { start: '00:00', end: '23:59' }
  },
  {
    name: 'Adrar Mechanics',
    role: 'MECHANIC',
    garageType: 'ELECTRICIAN',
    wilayaId: 1,
    commune: 'Adrar',
    description: 'Toyota and Nissan electrical expert for desert conditions.',
    rating: 4.7,
    totalReviews: 27,
    phone: '0661112233',
    specialty: ['Toyota', 'Nissan', 'Mitsubishi'],
    isAvailable: true,
    workingDays: [0, 1, 2, 3, 4, 6],
    workingHours: { start: '07:00', end: '13:00' }
  },
  {
    name: 'Chlef Auto Parts',
    role: 'PARTS_SHOP',
    wilayaId: 2,
    commune: 'Chlef',
    description: 'Best prices for French car parts.',
    rating: 4.3,
    totalReviews: 16,
    phone: '0555445566',
    specialty: ['Renault', 'Peugeot', 'Citroën', 'Dacia'],
    isAvailable: true,
    workingDays: [6, 0, 1, 2, 3, 4],
    workingHours: { start: '08:00', end: '19:00' }
  },
  {
    name: 'Blida Body Shop',
    role: 'MECHANIC',
    garageType: 'AUTO_BODY',
    wilayaId: 9,
    commune: 'Blida',
    description: 'Expert dent repair and painting for all vehicles.',
    rating: 4.6,
    totalReviews: 22,
    phone: '0540123123',
    specialty: ['Volkswagen', 'Seat', 'Skoda', 'Audi'],
    isAvailable: true,
    workingDays: [0, 1, 2, 3, 4],
    workingHours: { start: '08:00', end: '17:00' }
  }
];

const seedDatabase = async () => {
  try {
    // Connect to MongoDB
    await connectDB();

    // Clear existing data
    await ServiceProvider.deleteMany({});
    await User.deleteMany({});

    console.log('Cleared existing data');

    // Create users and providers
    for (const providerData of sampleProviders) {
      // Create user for each provider
      const user = await User.create({
        name: providerData.name,
        email: `${providerData.name.toLowerCase().replace(/\s+/g, '')}@example.com`,
        password: 'password123',
        role: providerData.role,
        phone: providerData.phone,
        garageType: providerData.garageType,
        wilayaId: providerData.wilayaId,
        commune: providerData.commune,
        isAvailable: providerData.isAvailable
      });

      // Create provider profile
      await ServiceProvider.create({
        ...providerData,
        userId: user._id,
        isVerified: true
      });

      console.log(`Created: ${providerData.name}`);
    }

    // Create a test client user
    await User.create({
      name: 'Test Client',
      email: 'client@example.com',
      password: 'password123',
      role: 'CLIENT',
      phone: '0550000000'
    });

    console.log('Created test client user');

    console.log('✅ Database seeded successfully!');
    console.log('\nTest Accounts:');
    console.log('Client: client@example.com / password123');
    sampleProviders.forEach(p => {
      console.log(`${p.role}: ${p.name.toLowerCase().replace(/\s+/g, '')}@example.com / password123`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();
