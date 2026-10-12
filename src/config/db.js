import mongoose from "mongoose";

export async function connectDatabase() {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI is not configured");
  }

  return mongoose.connect(process.env.MONGODB_URI, {
    serverSelectionTimeoutMS: 10000,
    connectTimeoutMS: 10000,
  });
}

// import mongoose from 'mongoose';

// export async function connectDatabase(uri = process.env.MONGODB_URI) {
//   if (!uri) throw new Error('MONGODB_URI is required');
//   await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 });
//   return mongoose.connection;
// }
