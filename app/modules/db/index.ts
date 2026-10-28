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
 *
 * Fails fast (8s server selection timeout) so a down/unreachable database
 * surfaces as an error instead of leaving a transcription job stuck
 * indefinitely on the "saving" step.
 */
export async function connectDb(uri?: string): Promise<typeof mongoose> {
  if (mongoose.connection.readyState === 1) {
    return mongoose;
  }
  if (!connectionPromise) {
    const targetUri = uri ?? getMongoUri();
    const started = Date.now();
    console.log(
      `[db] connecting to MongoDB → ${targetUri} (db: ${getDbName()})`
    );
    connectionPromise = mongoose
      .connect(targetUri, {
        dbName: getDbName(),
        serverSelectionTimeoutMS: 8000,
      })
      .then((m) => {
        console.log(`[db] MongoDB connected in ${Date.now() - started}ms`);
        return m;
      })
      .catch((err) => {
        connectionPromise = null;
        console.error(
          `[db] MongoDB connection failed after ${Date.now() - started}ms: ${
            err instanceof Error ? err.message : String(err)
          }`
        );
        throw err;
      });
  }
  return connectionPromise;
}

export async function disconnectDb(): Promise<void> {
  console.log("[db] disconnecting MongoDB");
  connectionPromise = null;
  await mongoose.disconnect();
}
