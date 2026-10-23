import mongoose from "mongoose";

export function getMongoUri(): string {
  return process.env.MONGODB_URI || "mongodb://localhost:27017";
}

export function getDbName(): string {
  return process.env.MONGODB_DB_NAME || "ty-transcriber";
}

let connectionPromise: Promise<typeof mongoose> | null = null;

/**
 * Connect to MongoDB. Safe to call repeatedly: returns the existing
 * connection if already open. Callers may pass an explicit uri (tests).
 */
export async function connectDb(uri?: string): Promise<typeof mongoose> {
  if (mongoose.connection.readyState === 1) {
    return mongoose;
  }
  if (!connectionPromise) {
    connectionPromise = mongoose
      .connect(uri ?? getMongoUri(), { dbName: getDbName() })
      .catch((err) => {
        connectionPromise = null;
        throw err;
      });
  }
  return connectionPromise;
}

export async function disconnectDb(): Promise<void> {
  connectionPromise = null;
  await mongoose.disconnect();
}