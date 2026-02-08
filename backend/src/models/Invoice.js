// import mongoose from "mongoose";

// const invoiceSchema = new mongoose.Schema({
//   shop: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: "Shop",
//     required: true
//   },
//   user: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: "User",
//     required: true
//   },
//   invoiceNumber: {
//     type: String,
//     unique: true
//   },
//   items: [
//     {
//       name: String,
//       qty: Number,
//       price: Number,
//       total: Number
//     }
//   ],
//   subtotal: Number,
//   tax: Number,
//   grandTotal: Number,
//   pdfUrl: String,
//   // GST...
//   cgst: Number,
//   sgst: Number,
//   gstPercent: {
//     type: Number,
//     default: 18
//   }

// }, { timestamps: true });

// export default mongoose.model("Invoice", invoiceSchema);
// models/Invoice.js
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
    required: true,
    unique: true
  },
  items: [
    {
      name: { type: String, required: true },
      unit: { type: String, required: true },
      qty: { type: Number, required: true },
      price: { type: Number, required: true },
      gstRate: { type: Number, default: 18 },      // ✅ GST rate per item
      taxAmount: { type: Number, required: true },  // ✅ Tax for this item
      subtotal: { type: Number, required: true },   // ✅ Before tax
      total: { type: Number, required: true }       // ✅ After tax
    }
  ],
  subtotal: { type: Number, required: true },
  tax: { type: Number, required: true },
  cgst: { type: Number, required: true },
  sgst: { type: Number, required: true },
  grandTotal: { type: Number, required: true },
  pdfUrl: { type: String }
}, { timestamps: true });

export default mongoose.model("Invoice", invoiceSchema);