import mongoose from "mongoose";

const saleSchema = new mongoose.Schema({
  shop: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Shop",
    required: true
  },
  items: [
    {
      product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true
      },
      quantity: { type: Number, required: true },
      price: { type: Number, required: true }
    }
  ],
  totalAmount: {
    type: Number,
    required: true
  },
  paymentMethod: {
    type: String,
    enum: ["CASH", "UPI", "CARD"],
    default: "CASH"
  },
  invoiceNumber: {
    type: String,
    unique: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  }
}, { timestamps: true });

export default mongoose.model("Sale", saleSchema);
