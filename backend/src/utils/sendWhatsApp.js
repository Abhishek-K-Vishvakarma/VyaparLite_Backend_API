import twilio from "twilio";

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

export const formatIndianWhatsAppNumber = (phone) => {
  // remove spaces, dashes etc
  let clean = phone.replace(/\D/g, "");

  // already +91 ke saath aaya
  if (clean.length === 12 && clean.startsWith("91")) {
    return `whatsapp:+${ clean }`;
  }

  // normal 10 digit Indian number
  if (clean.length === 10) {
    return `whatsapp:+91${ clean }`;
  }

  throw new Error("Invalid Indian phone number");
};

export const sendInvoiceWhatsApp = async ({
  to,
  message,
}) => {
  try {
    const whatsappTo = formatIndianWhatsAppNumber(to);
    const res = await client.messages.create({
      from: "whatsapp:+14155238886",
      to: whatsappTo,
      body: message
    });

    console.log("✅ WhatsApp PDF sent:", res.sid);
    return res;
  } catch (error) {
    console.error("❌ WhatsApp Error:", error.message);
    throw new Error("WhatsApp sending failed");
  }
};
// my twilio phoneNumber : +13465953021
// Twilio recovery code : M3B6TBSUQGKB8RLBSPGXB1L1