import mongoose from "mongoose";
import User from "../models/User.js";

const runMigration = async () => {
  try {
    const result = await User.updateMany(
      {
        deviceId: { $ne: null },
        tokenExpiresAt: { $eq: null }
      },
      {
        $set: {
          tokenExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24h
        }
      }
    );

    if (result.modifiedCount > 0) {
      console.log(`✅ Migration done: ${ result.modifiedCount } user(s) updated`);
    } else {
      console.log("✅ Migration: no users needed update"); // already ran
    }
  } catch (error) {
    console.error("❌ Migration failed:", error);
  }
};

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    runMigration();
    console.log(`MongoDB Connected: ${ conn.connection.host }`);
  } catch (err) {
    console.error(`Error: ${ err.message }`);
    process.exit(1);
  }
};

export default connectDB;
