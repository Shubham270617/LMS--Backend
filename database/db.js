import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Load .env
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "../.env") });

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  throw new Error("❌ MONGO_URI is not defined");
}

export const connectDB = async () => {
  try {
    const { connection } = await mongoose.connect(MONGO_URI, {
      dbName: "LIBRARY_MANAGEMENT_SYSTEM",
    });
    console.log(`✅ MongoDB connected: ${connection.host}`);
  } catch (err) {
    console.error("❌ MongoDB connection failed:", err);
    process.exit(1);
  }
};
