/**
 * One-time script: create an admin user or promote an existing user to ADMIN.
 *
 * Usage:
 *   node scripts/create-admin.js
 *
 * To promote an existing account instead, set PROMOTE_EMAIL:
 *   PROMOTE_EMAIL=someone@example.com node scripts/create-admin.js
 */

import 'dotenv/config';
import mongoose from 'mongoose';
import User from '../models/User.js';

const ADMIN_EMAIL    = process.env.ADMIN_EMAIL    || 'admin@example.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
const ADMIN_NAME     = process.env.ADMIN_NAME     || 'Admin';
const ADMIN_PHONE    = process.env.ADMIN_PHONE    || '0550000001';
const PROMOTE_EMAIL  = process.env.PROMOTE_EMAIL;   // optional: promote existing user

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  if (PROMOTE_EMAIL) {
    // Promote an existing user to ADMIN
    const user = await User.findOne({ email: PROMOTE_EMAIL });
    if (!user) {
      console.error(`No user found with email: ${PROMOTE_EMAIL}`);
      process.exit(1);
    }
    user.role = 'ADMIN';
    await user.save();
    console.log(`✅ Promoted ${PROMOTE_EMAIL} to ADMIN`);
  } else {
    // Create a new admin account (skip if already exists)
    const existing = await User.findOne({ email: ADMIN_EMAIL });
    if (existing) {
      if (existing.role !== 'ADMIN') {
        existing.role = 'ADMIN';
        await existing.save();
        console.log(`✅ Existing account ${ADMIN_EMAIL} promoted to ADMIN`);
      } else {
        console.log(`ℹ️  Admin account ${ADMIN_EMAIL} already exists`);
      }
    } else {
      await User.create({
        name: ADMIN_NAME,
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        role: 'ADMIN',
        phone: ADMIN_PHONE,
      });
      console.log(`✅ Admin account created: ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
    }
  }

  await mongoose.disconnect();
  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
