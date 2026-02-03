import express from "express";
import protect from "../middlewares/auth.middleware.js";
import { downloadInvoice, generatePDF, sendInvoiceByEmail, sendInvoiceByWhatsApp } from "../controllers/invoice.controller.js";
const router = express.Router();

router.post("/:id/pdf", protect, generatePDF);
router.get("/:id/download", protect, downloadInvoice);
router.post("/send-email", protect, sendInvoiceByEmail);
router.post("/send-whatsapp", sendInvoiceByWhatsApp);

// router.get("/:id/download", protect, async (req, res) => {
//   const invoice = await Invoice.findById(req.params.id);
//   if (!invoice || !invoice.pdfUrl) {
//     return res.status(404).json({ message: "Invoice not found" });
//   }
//   res.download(invoice.pdfUrl);
// });

export default router;
