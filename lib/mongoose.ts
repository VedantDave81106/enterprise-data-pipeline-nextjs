import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/fst_sl_2_telemetry";

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
  isConnected: boolean;
}

declare global {
  var mongooseCache: MongooseCache | undefined;
}

let cached: MongooseCache = global.mongooseCache || {
  conn: null,
  promise: null,
  isConnected: false,
};

if (!global.mongooseCache) {
  global.mongooseCache = cached;
}

// In-memory document fallback store when external MongoDB server is not running
export const inMemoryDocumentStore: Array<{
  _id: string;
  provider: string;
  type: string;
  rawPayload: any;
  createdAt: Date;
}> = [];

/**
 * Establishes cached connection to MongoDB using Mongoose (CO4 Object Database).
 * Gracefully falls back to in-memory document store if MongoDB is not reachable locally.
 */
export async function connectMongoose(): Promise<{ isConnected: boolean; error?: string }> {
  if (cached.conn && cached.isConnected) {
    return { isConnected: true };
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 2000, // Quick timeout for local environment resilience
    };

    cached.promise = mongoose
      .connect(MONGODB_URI, opts)
      .then((m) => {
        cached.isConnected = true;
        console.log("🍃 [Mongoose ODM] Successfully connected to MongoDB cluster.");
        return m;
      })
      .catch((err) => {
        cached.isConnected = false;
        cached.promise = null;
        console.warn("⚠️ [Mongoose ODM] MongoDB server not active; falling back to in-memory Document Store.");
        return null as any;
      });
  }

  try {
    cached.conn = await cached.promise;
    return { isConnected: cached.isConnected };
  } catch (err: any) {
    return { isConnected: false, error: err.message };
  }
}
