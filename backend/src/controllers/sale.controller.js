// controllers/sale.controller.js
import Sale from "../models/Sale.js";
import Invoice from "../models/Invoice.js";
import Shop from "../models/Shop.js";
import Product from "../models/Product.js";
import Notification from "../models/Notification.js";
import User from "../models/User.js";
import { generateInvoiceNumber } from "../utils/invoiceNumber.js";
import { sendPushNotification } from "../utils/pushNotification.js";
import { generateInvoicePDF } from "../utils/generateInvoice.js";

export const createSale = async (req, res) => {
  try {
    const { items, paymentMethod } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "No items in sale" });
    }

    const userId = req.user.id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(401).json({ message: "Unauthorized user" });
    }

    const shop = await Shop.findOne({ owner: userId });
    if (!shop) {
      return res.status(404).json({ message: "Shop not found" });
    }

    let subtotalAmount = 0;
    let totalTaxAmount = 0;
    const invoiceItems = [];

    // 🧮 Process items with individual GST rates
    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      const quantityInBaseUnit = Number(item.quantity);

      // Stock check
      if (product.stock < quantityInBaseUnit) {
        return res.status(400).json({
          message: `Insufficient stock for ${ product.name }. Available: ${ product.stock } ${ product.unit }`,
        });
      }

      // Deduct stock
      product.stock -= quantityInBaseUnit;
      await product.save();

      // ✅ Calculate item subtotal (before tax)
      const itemSubtotal = Number(product.price) * quantityInBaseUnit;

      // ✅ Calculate GST based on product's GST rate
      const gstRate = product.gstRate || 18;
      const itemTax = (itemSubtotal * gstRate) / 100;
      const itemTotal = itemSubtotal + itemTax;

      subtotalAmount += itemSubtotal;
      totalTaxAmount += itemTax;

      console.log(`Item: ${ product.name }`, {
        category: product.category,
        price: product.price,
        quantity: quantityInBaseUnit,
        gstRate: `${ gstRate }%`,
        subtotal: itemSubtotal.toFixed(2),
        tax: itemTax.toFixed(2),
        total: itemTotal.toFixed(2),
      });

      // ✅ Invoice snapshot with GST details
      invoiceItems.push({
        name: product.name,
        unit: product.unit,
        qty: quantityInBaseUnit,
        price: Number(product.price),
        gstRate: gstRate,
        taxAmount: itemTax,
        subtotal: itemSubtotal,
        total: itemTotal,
      });

      // Attach to sale items
      item.price = Number(product.price);
      item.unit = product.unit;
      item.gstRate = gstRate;
    }

    const invoiceNumber = generateInvoiceNumber();

    // Create Sale
    const sale = await Sale.create({
      shop: shop._id,
      items,
      totalAmount: subtotalAmount + totalTaxAmount,
      paymentMethod,
      invoiceNumber,
      createdBy: userId,
    });

    // ✅ Calculate total CGST and SGST
    const cgst = totalTaxAmount / 2;
    const sgst = totalTaxAmount / 2;
    const grandTotal = subtotalAmount + totalTaxAmount;

    console.log(`Invoice totals:`, {
      subtotal: subtotalAmount.toFixed(2),
      totalTax: totalTaxAmount.toFixed(2),
      cgst: cgst.toFixed(2),
      sgst: sgst.toFixed(2),
      grandTotal: grandTotal.toFixed(2),
    });

    // ✅ Create Invoice with detailed items
    const invoice = await Invoice.create({
      shop: shop._id,
      user: userId,
      invoiceNumber,
      items: invoiceItems,
      subtotal: subtotalAmount,
      tax: totalTaxAmount,
      cgst,
      sgst,
      grandTotal,
      pdfUrl: null,
    });

    // Generate PDF
    const { buffer, fileName } = await generateInvoicePDF(invoice, shop);
    invoice.pdfUrl = `data:application/pdf;base64,${ buffer.toString("base64") }`;
    await invoice.save();

    // Notification
    await Notification.create({
      user: userId,
      title: "New Sale Completed",
      message: `Invoice ${ invoiceNumber } generated (₹${ grandTotal.toFixed(2) })`,
      type: "SALE",
    });

    // Push notification
    if (user.fcmToken) {
      await sendPushNotification({
        fcmToken: user.fcmToken,
        title: "Sale Successful 🧾",
        body: `Invoice ${ invoiceNumber } | ₹${ grandTotal.toFixed(2) }`,
      });
    }

    return res.status(201).json({
      message: "Sale & Invoice created successfully",
      sale,
      invoice,
    });

  } catch (error) {
    console.error("Sale creation error:", error);
    res.status(500).json({ message: error.message || "Server error" });
  }
};