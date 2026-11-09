/* eslint-disable no-console */
import mongoose from 'mongoose';
import { connectDB, disconnectDB } from '../config/db';
import { env } from '../config/env';
import { User } from '../models/User';

async function run() {
  await connectDB();
  const existing = await User.findOne({ email: env.ADMIN_EMAIL }).select('+password');
  if (existing) {
    existing.role = 'admin';
    existing.isVerified = true;
    existing.isActive = true;
    if (process.argv.includes('--reset-password')) {
      existing.password = env.ADMIN_PASSWORD;
    }
    await existing.save();
    console.log(`Admin account ready: ${existing.email}`);
  } else {
    await User.create({
      name: env.ADMIN_NAME,
      email: env.ADMIN_EMAIL,
      password: env.ADMIN_PASSWORD,
      role: 'admin',
      isVerified: true,
      isActive: true,
    });
    console.log(`Admin account created: ${env.ADMIN_EMAIL}`);
  }
  console.log('Use ADMIN_PASSWORD from your environment to sign in. Change it after first login.');
  await disconnectDB();
}

run().catch(async (error) => {
  console.error('Failed to create admin:', error);
  await mongoose.disconnect();
  process.exit(1);
});
