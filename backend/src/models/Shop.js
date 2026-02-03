import mongoose from "mongoose";

const shopSchema = new mongoose.Schema({
  name: { type: String, required: true },
  address: { type: String },
  phone: { type: String },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  type: { type: String, enum: ["Kirana", "Medical", "Mobile"], default: "Kirana" },
  gstin: { type: String },
}, { timestamps: true });

export default mongoose.model("Shop", shopSchema);
