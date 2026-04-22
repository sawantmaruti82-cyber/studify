import mongoose from 'mongoose';

import { env } from './env.js';

mongoose.set('strictQuery', true);

export async function connectDatabase(uri = env.mongoUri) {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (!uri) {
    throw new Error('MONGODB_URI is missing. Add it to backend/.env before starting the server.');
  }

  await mongoose.connect(uri);
  return mongoose.connection;
}

export async function disconnectDatabase() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
}
