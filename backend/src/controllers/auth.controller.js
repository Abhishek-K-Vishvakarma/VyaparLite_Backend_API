import User from "../models/User.js";
import bcrypt from "bcryptjs";
import { generateToken } from "../utils/jwt.js";
import Notification from "../models/Notification.js";
import { sendPushNotification } from "../utils/pushNotification.js";
import jwt from 'jsonwebtoken';
import crypto, { verify } from "crypto";
import otpGenerate from 'otp-generator';
const hashDevice = (value) => {
  crypto.createHash("sha256").update(value).digest("hex");
}
// Register User
export default {
  register: async (req, res) => {
    try {
      const { name, email, password, shop, role, deviceId, fcmToken } = req.body;

      // Validation
      if (!deviceId) {
        return res.status(400).json({ message: "deviceId is required" });
      }

      // Check existing user
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(409).json({ message: "User already exists" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user
      const user = await User.create({
        name,
        email,
        password: hashedPassword,
        shop,
        role,
        deviceId,
        fcmToken
      });
      //  Create notification (signup / security)
      await Notification.create({
        user: user._id,
        title: "Welcome to VyaparLite",
        message: "Your account has been created successfully.",
        type: "SYSTEM"
      });

      await sendPushNotification({
        fcmToken,
        title: "Welcome to VyaparLite 🎉",
        body: "Your account is ready. Start managing your business smartly."
      });

      res.status(201).json({
        message: "User registered successfully",
        userId: user._id
      });

    } catch (error) {
      console.error("Signup Error:", error);
      res.status(500).json({ message: "Server error" });
    }
  },

  login: async (req, res) => {
    try {
      const { email, password, deviceId, fcmToken } = req.body;

      // Basic validation
      if (!email || !password || !deviceId) {
        return res.status(400).json({ message: "Missing credentials" });
      }

      // Find user
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // Password check
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // ✅ DEVICE ENFORCEMENT — only block if token is still ACTIVE
      // ✅ FIXED DEVICE ENFORCEMENT
      if (user.deviceId && user.deviceId !== deviceId) {

        // Case 1: tokenExpiresAt exists and token is still active → BLOCK
        // Case 2: tokenExpiresAt is null but deviceId exists → BLOCK (legacy/safe default)
        const isTokenActive = user.tokenExpiresAt
          ? new Date() < new Date(user.tokenExpiresAt)  // token exists → check expiry
          : true;                                        // token is null → assume active (safe default)

        if (isTokenActive) {
          await Notification.create({
            user: user._id,
            title: "Blocked Login Attempt",
            message: `Login attempt from a new device (${ deviceId }) was blocked.`,
            type: "SECURITY"
          });

          await sendPushNotification({
            fcmToken: user.fcmToken,
            title: "Security Alert 🚨",
            body: "Login attempt blocked from another device."
          });

          return res.status(403).json({
            message: "This user is already logged in on another device"
          });
        }
        // Case 3: token is expired → allow login (falls through)
      }

      // ✅ Update deviceId, fcmToken, and tokenExpiresAt
      const TOKEN_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

      user.deviceId = deviceId;
      if (fcmToken) user.fcmToken = fcmToken;
      user.tokenExpiresAt = new Date(Date.now() + TOKEN_EXPIRY_MS); // ← key addition
      await user.save();

      // ✅ Generate JWT (24h)
      const token = generateToken(user._id, deviceId);

      // ✅ Set HttpOnly cookie
      res.cookie("token", token, {
        httpOnly: true,
        sameSite: "none",
        secure: true,
        path: "/",
        maxAge: TOKEN_EXPIRY_MS
      });

      //     // Push notification on success
      if (token && user?.deviceId) {
        await sendPushNotification({
          fcmToken: user.fcmToken,
          title: "Success",
          body: "Login successful"
        });
      }

      //     // Success response
      res.status(200).json({
        message: "Login successful",
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          token: token
        }
      });

    } catch (error) {
      console.error("Login Error:", error);
      res.status(500).json({ message: "Server error" });
    }
  },

  myProfile: async (req, res) => {
    try {
      const profile = await User.findOne(req.user._id);
      console.log(profile);
      if (!profile) return res.status(404).json({ message: "User not found!" });
      res.status(200).json({ message: "User profile getting successfully!", profile });
    } catch (error) {
      console.error("Profile Error:", error);
      res.status(500).json({ message: "Server error" });
    }
  },

  logout: async (req, res) => {
    try {
      // Always refetch from DB
      const user = await User.findById(req.user.id);
      if (user) {
        user.isLoggedIn = false;
        user.deviceId = null;
        user.fcmToken = null;
        user.tokenExpiresAt = null;  // ← sirf yeh add karo
        await user.save();
      }

      // Clear auth cookie (MUST match login)
      res.clearCookie("token", {
        httpOnly: true,
        sameSite: "none",
        secure: true,
        path: "/"
      });

      // Clear device token if used
      res.clearCookie("deviceToken", {
        httpOnly: true,
        sameSite: "none",
        secure: true,
        path: "/"
      });

      return res.status(200).json({
        message: "Logged out successfully"
      });

    } catch (error) {
      console.error("Logout Error:", error);
      res.status(500).json({ message: "Server error" });
    }
  },

  forgotPassword: async (req, res) => {
    try {
      const { email } = req.body;
      const user = await User.findOne({ email });
      if (!user) return res.status(404).json({ message: "User not found" });
      const otp = Math.floor(new Date(100 * Math.random() + 900000));
      await User.findOneAndUpdate(
        { email },
        { otp, otpExpired: Date.now() + 1 * 60 * 1000 },
        { new: true, runValidators: true }
      );
      res.status(200).json({
        message: "Otp send to user!"
      });
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  },

  verifyOTP: async (req, res) => {
    try {
      const {otp} = req.body;
      const user = await User.findOne({otp});
      if(otp !== user?.otp){
         return res.status(400).json({message: "Otp not matched"});
      }
      if(Date.now() > user?.otpExpired){
        res.status(400).json({message: "Otp has been expired!"});
        delete user?.otp;
      }
      await User.findOneAndUpdate({otp}, {otp: null}, {new: true})
      res.status(200).json({message: "User otp verified successfully!", status_code: 200});
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  },

  resetPassword: async (req, res) => {
    try {
      const { email, newPassword } = req.body;
      const user = await User.findOne({ email });
      if(user?.email !== email){
         return res.status(400).json({message: "User does not matched!"});
      }
      const hashPassword = await bcrypt.hash(newPassword, 10);
      await User.findOneAndUpdate({ email }, { password: hashPassword }, {new : true});
      res.status(200).json({ message: "User reset password successfully!", status_code: 200 });
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  }
}

