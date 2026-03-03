/**
 * One-time migration: convert isVerified Boolean → String enum
 *   true  → 'APPROVED'
 *   false → 'PENDING'
 */
import 'dotenv/config';
import mongoose from 'mongoose';

await mongoose.connect(process.env.MONGODB_URI);
const col = mongoose.connection.db.collection('serviceproviders');

const trueCount  = await col.countDocuments({ isVerified: true });
const falseCount = await col.countDocuments({ isVerified: false });
console.log(`Found: isVerified=true → ${trueCount}, isVerified=false → ${falseCount}`);

if (trueCount > 0) {
  const r = await col.updateMany({ isVerified: true },  { $set: { isVerified: 'APPROVED' } });
  console.log(`Migrated ${r.modifiedCount} documents → APPROVED`);
}
if (falseCount > 0) {
  const r = await col.updateMany({ isVerified: false }, { $set: { isVerified: 'PENDING'  } });
  console.log(`Migrated ${r.modifiedCount} documents → PENDING`);
}

const approved = await col.countDocuments({ isVerified: 'APPROVED' });
const pending  = await col.countDocuments({ isVerified: 'PENDING'  });
const rejected = await col.countDocuments({ isVerified: 'REJECTED' });
console.log(`\nResult: APPROVED=${approved}  PENDING=${pending}  REJECTED=${rejected}`);

await mongoose.disconnect();
console.log('✅ Migration complete');
process.exit(0);
