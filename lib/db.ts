import mongoose from "mongoose"
import { MongoClient } from "mongodb"

const uri = process.env.MONGODB_URI!
const g = globalThis as unknown as {
  _mongoose?: Promise<typeof mongoose>
  _client?: MongoClient
}

export function connectDb() {
  if (!uri) throw new Error("MONGODB_URI is not set")
  return (g._mongoose ??= mongoose.connect(uri))
}

// native client (lazy-connects), used by BetterAuth's MongoDB adapter
export function mongoClient() {
  if (!uri) throw new Error("MONGODB_URI is not set")
  return (g._client ??= new MongoClient(uri))
}
