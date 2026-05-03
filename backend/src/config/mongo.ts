import mongoose from 'mongoose';

/**
 * Connects to MongoDB for raw signal audit logging.
 */
export async function connectMongo(): Promise<void> {
  const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/ims_signals';
  try {
    await mongoose.connect(uri);
    console.log('✅ [DB] MongoDB connected');
  } catch (error) {
    console.error('❌ [DB] MongoDB connection failed:', error);
    throw error;
  }
}

/**
 * Disconnects from MongoDB gracefully.
 */
export async function disconnectMongo(): Promise<void> {
  await mongoose.disconnect();
  console.log('🔌 [DB] MongoDB disconnected');
}
