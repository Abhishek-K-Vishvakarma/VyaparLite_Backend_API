import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
  name: {
    type: String, required: true, trim: true,
    lowercase: true, 
  },
  shop: { type: mongoose.Schema.Types.ObjectId, ref: "Shop", required: true },
  category: { type: String }, // Optional for future
  price: { type: Number, required: true },
  unit: {
    type: String,
    enum: ["KG", "PIECE", "BOTTLE", "PACKET"],
    required: true
  },
  stock: {
    type: Number, // ALWAYS BASE UNIT
    required: true
  },
  batch: { type: String },      // For Medical
  expiry: { type: Date },       // For Medical
  imei: { type: String },       // For Mobile
  warranty: { type: String },   // For Mobile
  image: { type: String },      // URL from Cloudinary
}, { timestamps: true });

productSchema.index(
  { name: 1, shop: 1 },
  { unique: true }
);
export default mongoose.model("Product", productSchema);
