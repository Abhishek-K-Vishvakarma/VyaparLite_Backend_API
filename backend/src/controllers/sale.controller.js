import Sale from "../models/Sale.js";
import Invoice from "../models/Invoice.js";
import Shop from "../models/Shop.js";
import Product from "../models/Product.js";
import Notification from "../models/Notification.js";
import { generateInvoiceNumber } from "../utils/invoiceNumber.js";
import { sendPushNotification } from "../utils/pushNotification.js";
import { generateInvoicePDF } from "../utils/generateInvoice.js";
export const createSale = async (req, res) => {
  try {
    const { items, paymentMethod } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ message: "No items in sale" });
    }

    // 🔐 Resolve shop
    const shop = await Shop.findOne({ owner: req.user._id });
    if (!shop) {
      return res.status(404).json({ message: "Shop not found" });
    }

    let totalAmount = 0;
    const invoiceItems = [];

    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      // ❌ Stock check
      if (product.stock < item.quantity) {
        return res.status(400).json({
          message: `Insufficient stock for ${ product.name }`,
        });
      }

      // ✅ Deduct stock (grams or count)
      product.stock -= item.quantity;
      await product.save();

      // ✅ Correct amount calculation
      let itemTotal = 0;

      if (product.unit === "KG") {
        // quantity is in grams
        itemTotal = (product.price / 1000) * item.quantity;
      } else {
        itemTotal = product.price * item.quantity;
      }

      totalAmount += itemTotal;

      // 🧾 Invoice snapshot
      invoiceItems.push({
        name: product.name,
        unit: product.unit,
        qty: item.quantity, // grams or count
        price: product.price,
        total: itemTotal,
      });

      // Attach snapshot price to sale item
      item.price = product.price;
      item.unit = product.unit;
    }

    const invoiceNumber = generateInvoiceNumber();

    // 🧾 Sale record
    const sale = await Sale.create({
      shop: shop._id,
      items,
      totalAmount,
      paymentMethod,
      invoiceNumber,
      createdBy: req.user._id,
    });

    // 💰 GST
    const gstPercent = 18;
    const gstAmount = (totalAmount * gstPercent) / 100;
    const cgst = gstAmount / 2;
    const sgst = gstAmount / 2;

    // 📄 Invoice
    const invoice = await Invoice.create({
      shop: shop._id,
      user: req.user._id,
      invoiceNumber,
      items: invoiceItems,
      subtotal: totalAmount,
      tax: gstAmount,
      cgst,
      sgst,
      gstPercent,
      grandTotal: totalAmount + gstAmount,
      pdfUrl: null,
    });

    // 📄 Generate PDF
    const pdfUrl = await generateInvoicePDF(invoice, shop);
    invoice.pdfUrl = pdfUrl;
    await invoice.save();

    // 🔔 Notification
    await Notification.create({
      user: req.user._id,
      title: "New Sale Completed",
      message: `Invoice ${ invoiceNumber } generated (₹${ totalAmount.toFixed(2) })`,
      type: "SALE",
    });

    // 📲 Push notification
    if (req.user.fcmToken) {
      await sendPushNotification({
        fcmToken: req.user.fcmToken,
        title: "Sale Successful 🧾",
        body: `Invoice ${ invoiceNumber } | ₹${ totalAmount.toFixed(2) }`,
      });
    }

    res.status(201).json({
      message: "Sale & Invoice created successfully",
      sale,
      invoice,
    });
  } catch (error) {
    console.error("Create Sale Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
