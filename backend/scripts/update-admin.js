import 'dotenv/config';
import mongoose from 'mongoose';
import User from '../models/User.js';

await mongoose.connect(process.env.MONGODB_URI);

const admin = await User.findOne({ role: 'ADMIN' });
if (!admin) {
  console.error('No admin user found.');
  process.exit(1);
}

admin.email = 'nedjari088@gmail.com';
admin.password = 'Louai@2610';
await admin.save();

console.log('✅ Admin updated successfully');
console.log('   Email:    nedjari088@gmail.com');
console.log('   Password: Louai@2610');

await mongoose.disconnect();
process.exit(0);
