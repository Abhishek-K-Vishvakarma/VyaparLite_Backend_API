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

  // TABLE HEADER
  page.drawText("Item", { x: 50, y, size: 11, font });
  page.drawText("Qty", { x: 300, y, size: 11, font });
  page.drawText("Price", { x: 360, y, size: 11, font });
  page.drawText("Total", { x: 450, y, size: 11, font });

  y -= 15;
  page.drawLine({
    start: { x: 50, y },
    end: { x: width - 50, y },
    thickness: 0.5,
    color: rgb(0.8, 0.8, 0.8)
  });

  y -= 15;

  invoice.items.forEach(item => {
    page.drawText(item.name, { x: 50, y, size: 10, font });
    page.drawText(String(item.qty), { x: 300, y, size: 10, font });
    page.drawText(`₹${ item.price }`, { x: 360, y, size: 10, font });
    page.drawText(`₹${ item.total }`, { x: 450, y, size: 10, font });
    y -= 18;
  });

  y -= 10;
  page.drawLine({
    start: { x: 300, y },
    end: { x: width - 50, y },
    thickness: 1,
    color: rgb(0.8, 0.8, 0.8)
  });

  y -= 20;
  page.drawText(`Subtotal: ₹${ invoice.subtotal }`, { x: 350, y, size: 11, font });
  y -= 15;
  page.drawText(`Tax: ₹${ invoice.tax }`, { x: 350, y, size: 11, font });
  y -= 15;
  page.drawText(`CGST (9%): ₹${ invoice.cgst }`, { x: 350, y, size: 11, font });
  y -= 15;
  page.drawText(`SGST (9%): ₹${ invoice.sgst }`, { x: 350, y, size: 11, font });
  y -= 15;
  page.drawText(`Grand Total: ₹${ invoice.grandTotal }`, {
    x: 350,
    y,
    size: 13,
    font
  });

  const pdfBytes = await pdfDoc.save();

  // ✅ RETURN BUFFER + META
  return {
    buffer: Buffer.from(pdfBytes),
    fileName: `${ invoice.invoiceNumber }.pdf`
  };
};
