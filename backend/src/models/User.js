import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  shop: { type: mongoose.Schema.Types.ObjectId, ref: "Shop" },
  role: { type: String, enum: ["owner", "manager", "staff"], default: "manager" },
  isLoggedIn: { type: Boolean, default: false },
  deviceHash: String,
  deviceId: { type: String }, // Track login device
  fcmToken: { type: String }, // For push notifications
  tokenExpiresAt: { type: Date, default: null },  // ← added this
  otp: String,
  otpExpired: {type: Date, default: Date.now}
}, { timestamps: true });

export default mongoose.model("User", userSchema);