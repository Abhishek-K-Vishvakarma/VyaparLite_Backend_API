import Invoice from "../models/Invoice.js";
import { generateInvoicePDF } from "../utils/generateInvoice.js";
import { sendInvoiceEmail } from "../utils/sendEmail.js";
import { sendInvoiceWhatsApp } from "../utils/sendWhatsApp.js";
import path from 'path';
import fs from 'fs';
import Shop from "../models/Shop.js";

export const generatePDF = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice || !invoice.pdfUrl) {
      return res.status(404).json({ message: "Invoice not found" });
    }
    const base64Data = invoice.pdfUrl.split(",")[1];
    const buffer = Buffer.from(base64Data, "base64");

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=${ invoice.invoiceNumber }.pdf`
    );
    res.send(buffer);
  } catch (err) {
    console.error("PDF Error:", err);
    res.status(500).json({ message: "PDF generation failed" });
  }
};


export const downloadInvoice = async (req, res) => {
  try {
    const { id } = req.params;

    const invoice = await Invoice.findById(id);
    if (!invoice || !invoice.pdfUrl) {
      return res.status(404).json({ message: "Invoice PDF not found" });
    }

    // ✅ Extract Base64 part
    const base64Data = invoice.pdfUrl.split(",")[1];
    const buffer = Buffer.from(base64Data, "base64");

    // ✅ Proper headers for download
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=${ invoice.invoiceNumber }.pdf`
    );

    return res.send(buffer);

  } catch (error) {
    console.error("Download Invoice Error:", error);
    res.status(500).json({
      message: "Server Error",
      error: error.message
    });
  }
};

export const sendInvoiceByEmail = async (req, res) => {
  try {
    const { invoiceId, customerEmail } = req.body;

    if (!invoiceId || !customerEmail) {
      return res.status(400).json({ message: "invoiceId and email required" });
    }

    const invoice = await Invoice.findById(invoiceId);
    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    if (!invoice.pdfUrl) {
      return res.status(400).json({ message: "Invoice PDF not generated yet" });
    }

    const pdfPath = path.join(process.cwd(), invoice.pdfUrl);
    // await sendInvoiceEmail(customerEmail, pdfPath);
    await sendInvoiceEmail({
      to: customerEmail,
      subject: `Invoice ${ invoice.invoiceNumber } | VyaparLite`,
      text: `Dear Customer, Thank you for shopping with us 🙏 Invoice No: ${ invoice.invoiceNumber } Amount Paid: ₹${ invoice.grandTotal } Please find your invoice attached. Regards, VyaparLite`,
      pdfPath: pdfPath
    });
    res.status(200).json({ message: "Invoice email sent successfully" });

  } catch (error) {
    console.error("Send Invoice Email Error:", error);
    res.status(500).json({ message: "Email sending failed" });
  }
};
// Twilio Invoice send to whatsApp...
export const sendInvoiceByWhatsApp = async (req, res) => {
  try {
    const { phone, invoiceId } = req.body;
    const invoice = await Invoice.findById(invoiceId);
    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }
    const msg = `🧾 *VyaparLite Invoice*
    Invoice No: ${ invoice.invoiceNumber }
    Grand Total: ₹${ invoice.grandTotal }
   📎PDF attached below
    PDF: ${ process.env.BASE_URL }${ invoice.pdfUrl }`;
    await sendInvoiceWhatsApp({
      to: phone,
      message: msg,
    });
    res.json({ message: "Invoice PDF sent on WhatsApp ✅" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "WhatsApp sending failed" });
  }
};
