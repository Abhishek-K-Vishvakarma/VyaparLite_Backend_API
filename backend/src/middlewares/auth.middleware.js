import { verifyToken } from "../utils/jwt.js";
import User from "../models/User.js";

const protect = async (req, res, next) => {
  try {

    // Extract token
    const token = req.cookies.token;

    if (!token) {
      return res.status(401).json({ message: "Unauthorized - No token", status : 401 });
    }

    const decoded = verifyToken(token);

    if (!decoded) {
      return res.status(401).json({ message: "Invalid token" });
    }

    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    // Device validation
    if (!user.deviceId || user.deviceId !== decoded.deviceId) {
      res.clearCookie("token");
      return res.status(403).json({ message: "Session expired - Device mismatch" });
    }

    req.user = user;
    req.userId = user._id;
    next();
  } catch (error) {
    return res.status(500).json({ message: "Server error in auth" });
  }
};

export default protect;