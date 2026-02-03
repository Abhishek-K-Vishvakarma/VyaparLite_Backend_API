import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "secretkey";

// Generate token
export const generateToken = (userId, deviceId) => {
  return jwt.sign(
    { userId, deviceId },
    JWT_SECRET,
    { expiresIn: "24h" }
  );
};

// Verify token
export const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
};
