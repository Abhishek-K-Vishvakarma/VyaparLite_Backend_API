import mongoose from "mongoose";

const invoiceSchema = new mongoose.Schema({
  shop: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Shop",
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  invoiceNumber: {
    type: String,
    unique: true
  },
  items: [
    {
      name: String,
      qty: Number,
      price: Number,
      total: Number
    }
  ],
  subtotal: Number,
  tax: Number,
  grandTotal: Number,
  pdfUrl: String,
  // GST...
  cgst: Number,
  sgst: Number,
  gstPercent: {
    type: Number,
    default: 18
  }

}, { timestamps: true });

export default mongoose.model("Invoice", invoiceSchema);
