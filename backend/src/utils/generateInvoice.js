// utils/generateInvoice.js
import { PDFDocument, rgb } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import fs from "fs";
import path from "path";

export const generateInvoicePDF = async (invoice, shop) => {
  const pdfDoc = await PDFDocument.create();
  pdfDoc.registerFontkit(fontkit);

  const fontPath = path.join(
    process.cwd(),
    "src/assets/fonts/Roboto-Regular.ttf"
  );
  const fontBytes = fs.readFileSync(fontPath);
  const font = await pdfDoc.embedFont(fontBytes);

  const page = pdfDoc.addPage([595, 842]); // A4
  const { width, height } = page.getSize();
  let y = height - 40;

  // 🏪 SHOP HEADER
  page.drawText(shop.name || "VyaparLite Store", {
    x: 50,
    y,
    size: 20,
    font
  });

  y -= 25;
  page.drawText(`GSTIN: ${ shop.gstin || "N/A" }`, { x: 50, y, size: 10, font });
  y -= 15;
  page.drawText(`Phone: ${ shop.phone || "N/A" }`, { x: 50, y, size: 10, font });
  y -= 15;
  page.drawText(shop.address || "Smart Business Billing Solution", {
    x: 50,
    y,
    size: 10,
    font
  });

  // 🧾 Invoice info
  page.drawText("INVOICE", {
    x: width - 150,
    y: height - 40,
    size: 16,
    font
  });

  page.drawText(`Invoice No: ${ invoice.invoiceNumber }`, {
    x: width - 200,
    y: height - 70,
    size: 10,
    font
  });

  page.drawText(
    `Date: ${ new Date(invoice.createdAt).toLocaleDateString() }`,
    { x: width - 200, y: height - 90, size: 10, font }
  );

  y -= 30;
  page.drawLine({
    start: { x: 50, y },
    end: { x: width - 50, y },
    thickness: 1,
    color: rgb(0.8, 0.8, 0.8)
  });

  y -= 20;

  // ✅ TABLE HEADER with GST column
  page.drawText("Item", { x: 50, y, size: 11, font });
  page.drawText("Qty", { x: 220, y, size: 11, font });
  page.drawText("Price", { x: 300, y, size: 11, font });
  page.drawText("GST", { x: 390, y, size: 11, font });
  page.drawText("Total", { x: 470, y, size: 11, font });

  y -= 15;
  page.drawLine({
    start: { x: 50, y },
    end: { x: width - 50, y },
    thickness: 0.5,
    color: rgb(0.8, 0.8, 0.8)
  });

  y -= 15;

  // ✅ ITEMS WITH FORMATTED QUANTITY + UNIT + GST
  invoice.items.forEach(item => {
    const qty = Number(item.qty);
    const price = Number(item.price);
    const gstRate = Number(item.gstRate) || 18;
    const total = Number(item.total);
    let quantityDisplay;

    // ✅ Format quantity with proper unit display
    if (item.unit === "KG") {
      const kg = Math.floor(qty);
      const grams = Math.round((qty % 1) * 1000);

      if (kg === 0 && grams > 0) {
        quantityDisplay = `${ grams } g`;
      } else if (grams === 0) {
        quantityDisplay = `${ kg } KG`;
      } else {
        quantityDisplay = `${ kg } KG ${ grams } g`;
      }
    } else if (item.unit === "PIECE") {
      quantityDisplay = `${ qty } PIECE`;
    } else if (item.unit === "BOTTLE") {
      quantityDisplay = `${ qty } BOTTLE`;
    } else if (item.unit === "PACKET") {
      quantityDisplay = `${ qty } PKT`;
    } else {
      quantityDisplay = `${ qty } ${ item.unit || '' }`;
    }

    // Product name
    page.drawText(item.name, { x: 50, y, size: 10, font });

    // Quantity with unit
    page.drawText(quantityDisplay, { x: 220, y, size: 9, font });

    // Price per unit
    const priceLabel = item.unit === "PACKET" ? "PKT" :
      item.unit === "BOTTLE" ? "BTL" :
        item.unit === "PIECE" ? "PC" :
          item.unit || "";
    page.drawText(`₹${ price.toFixed(2) }/${ priceLabel }`, { x: 300, y, size: 8, font });

    // ✅ GST Rate
    page.drawText(`${ gstRate }%`, { x: 390, y, size: 9, font });

    // Item total
    page.drawText(`₹${ total.toFixed(2) }`, { x: 470, y, size: 10, font });

    y -= 18;
  });

  y -= 10;
  page.drawLine({
    start: { x: 220, y },
    end: { x: width - 50, y },
    thickness: 1,
    color: rgb(0.8, 0.8, 0.8)
  });

  y -= 20;

  // ✅ Totals with proper number formatting
  const subtotal = Number(invoice.subtotal);
  const tax = Number(invoice.tax);
  const cgst = Number(invoice.cgst);
  const sgst = Number(invoice.sgst);
  const grandTotal = Number(invoice.grandTotal);

  page.drawText(`Subtotal: ₹${ subtotal.toFixed(2) }`, {
    x: 370,
    y,
    size: 11,
    font
  });

  y -= 15;

  page.drawText(`Total Tax: ₹${ tax.toFixed(2) }`, {
    x: 370,
    y,
    size: 11,
    font
  });

  y -= 15;

  page.drawText(`CGST: ₹${ cgst.toFixed(2) }`, {
    x: 370,
    y,
    size: 10,
    font,
    color: rgb(0.4, 0.4, 0.4)
  });

  y -= 15;

  page.drawText(`SGST: ₹${ sgst.toFixed(2) }`, {
    x: 370,
    y,
    size: 10,
    font,
    color: rgb(0.4, 0.4, 0.4)
  });

  y -= 20;

  page.drawText(`Grand Total: ₹${ grandTotal.toFixed(2) }`, {
    x: 370,
    y,
    size: 14,
    font
  });

  const pdfBytes = await pdfDoc.save();

  return {
    buffer: Buffer.from(pdfBytes),
    fileName: `${ invoice.invoiceNumber }.pdf`
  };
};