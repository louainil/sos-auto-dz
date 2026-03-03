/**
 * Update admin credentials from environment variables.
 * Set ADMIN_EMAIL and ADMIN_PASSWORD in your .env file, then run:
 *   node scripts/update-admin.js
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import User from '../models/User.js';

const { ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;

if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
  console.error('Set ADMIN_EMAIL and ADMIN_PASSWORD in your .env file.');
  process.exit(1);
}

await mongoose.connect(process.env.MONGODB_URI);

const admin = await User.findOne({ role: 'ADMIN' });
if (!admin) {
  console.error('No admin user found. Run create-admin.js first.');
  process.exit(1);
}

admin.email = ADMIN_EMAIL;
admin.password = ADMIN_PASSWORD;
await admin.save();

console.log('✅ Admin credentials updated from .env');

await mongoose.disconnect();
process.exit(0);
