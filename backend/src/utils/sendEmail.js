import nodemailer from "nodemailer";
import path from "path";

// const transporter = nodemailer.createTransport({
//   host: "smtp-relay.brevo.com",
//   port: 587,
//   secure: false,
//   auth: {
//     user: "apikey",                 // 🔥 FIXED
//     pass: process.env.BREVO_PASS    // SMTP key
//   }
// });

// export const sendInvoiceEmail = async ({
//   to,
//   subject,
//   text,
//   pdfPath
// }) => {
//   try {
//     await transporter.sendMail({
//       from: `"VyaparLite" <vyaparlite@gmail.com>`, // ✅ verified Gmail
//       to,
//       subject,
//       text,
//       attachments: [
//         {
//           filename: path.basename(pdfPath),
//           path: pdfPath
//         }
//       ]
//     });

//     console.log("✅ Invoice email sent to:", to);
//   } catch (error) {
//     console.error("❌ Email Error:", error);
//     throw error;
//   }
// };

export const sendInvoiceEmail = async (data) => {
  console.log("data:", data);
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: "vishabhishek019@gmail.com",
      pass: process.env.MAIL_PASS
    }
  });

  await transporter.sendMail({
    from: "vishabhishek019@gmail.com",
    to: data?.to,
    subject: data?.subject,
    text: data?.text,
    attachments: [
      {
        filename: path.basename(data?.pdfPath),
        path: data?.pdfPath
      }
    ]
  });
};
