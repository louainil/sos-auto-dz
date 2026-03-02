/**
 * One-time migration: mark all existing ServiceProvider documents as isVerified=true
 * for users who have already verified their email.
 *
 * Usage:  node scripts/verify-existing-providers.js
 *
 * Safe to run multiple times — it only updates providers that are still unverified.
 */
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import mongoose from 'mongoose';
import ServiceProvider from '../models/ServiceProvider.js';
import User from '../models/User.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '..', '.env') });

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  // Find all unverified providers
  const unverified = await ServiceProvider.find({ isVerified: { $ne: true } });
  console.log(`Found ${unverified.length} unverified provider(s)`);

  let updated = 0;
  for (const provider of unverified) {
    const user = await User.findById(provider.userId);
    if (user?.isEmailVerified) {
      provider.isVerified = true;
      await provider.save();
      updated++;
      console.log(`  ✓ Verified: ${provider.name} (${provider.role})`);
    } else {
      console.log(`  ✗ Skipped: ${provider.name} — email not verified`);
    }
  }

  console.log(`\nDone. Updated ${updated} provider(s).`);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
