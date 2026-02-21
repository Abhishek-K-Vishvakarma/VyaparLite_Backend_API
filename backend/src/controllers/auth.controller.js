import User from "../models/User.js";
import bcrypt from "bcryptjs";
import { generateToken } from "../utils/jwt.js";
import Notification from "../models/Notification.js";
import { sendPushNotification } from "../utils/pushNotification.js";
import crypto, { verify } from "crypto";
import { Resend } from 'resend';
const resend = new Resend(process.env.RESEND_API_KEY);

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
      //  DEVICE ENFORCEMENT — only block if token is still ACTIVE
      //  FIXED DEVICE ENFORCEMENT
      // if (user.deviceId && user.deviceId !== deviceId) {
      // Case 2: tokenExpiresAt is null but deviceId exists → BLOCK (legacy/safe default)
      //   const isTokenActive = user.tokenExpiresAt
      //     ? new Date() < new Date(user.tokenExpiresAt)  // token exists → check expiry
      //     : true;                                        // token is null → assume active (safe default)
      //   if (isTokenActive) {
      //     await Notification.create({
      //       user: user._id,
      //       title: "Blocked Login Attempt",
      //       message: `Login attempt from a new device (${ deviceId }) was blocked.`,
      //       type: "SECURITY"
      //     });

      //     await sendPushNotification({
      //       fcmToken: user.fcmToken,
      //       title: "Security Alert 🚨",
      //       body: "Login attempt blocked from another device."
      //     });

      //     return res.status(403).json({
      //       message: "This user is already logged in on another device"
      //     });
      //   }
      // }
      const TOKEN_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours
      // const TOKEN_EXPIRY_MS = 1 * 60 * 1000; // for testing only
      user.deviceId = deviceId;
      if (fcmToken) user.fcmToken = fcmToken;
      user.tokenExpiresAt = new Date(Date.now() + TOKEN_EXPIRY_MS); // ← key addition
      await user.save();
      const token = generateToken(user._id, deviceId);
      res.cookie("token", token, {
        httpOnly: true,
        sameSite: "none",
        secure: true,
        path: "/",
        maxAge: TOKEN_EXPIRY_MS
      });

      //Push notification on success
      if (token && user?.deviceId) {
        await sendPushNotification({
          fcmToken: user.fcmToken,
          title: "Success",
          body: "Login successful"
        });
      }
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
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // ✅ Correct OTP
      const otp = Math.floor(100000 + Math.random() * 900000);

      await User.findOneAndUpdate(
        { email },
        {
          otp,
          isOtpVerify: false,
          otpExpired: Date.now() + 5 * 60 * 1000
        }
      );
      const { data, error } = await resend.emails.send({
        from: 'VyaparLite <onboarding@resend.dev>',
        to: ['vishabhishek019@gmail.com'],
        subject: 'VyaparLite OTP Verification',
        text: `Your VyaparLite OTP is ${ otp }. It is valid for 5 minutes. Do not share it with anyone.`,
        html: `
    <strong>VyaparLite OTP Verification</strong><br><br>
    Your one-time password (OTP) is <strong>${ otp }</strong>.<br>
    This OTP is valid for 5 minutes.<br><br>
    For your security, do not share this OTP with anyone.<br><br>
    — Team VyaparLite
  `
      });
      // 'delivered@resend.dev',
      if (error) {
        return console.error({ error });
      }

      console.log({ data });
      return res.status(200).json({
        message: "OTP sent successfully"
      });
    } catch (error) {
      console.error("Forgot Password Error:", error);
      return res.status(500).json({ message: "Server error" });
    }
  },

  verifyOTP: async (req, res) => {
    try {
      const { email, otp } = req.body;
      // 1. Find user properly
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(400).json({ message: "User not found" });
      }
      // 2. Check if already verified
      if (user.isOtpVerify) {
        return res.status(400).json({ message: "OTP already verified!" });
      }
      // 3. Check OTP match
      if (user.otp !== otp) {
        return res.status(400).json({ message: "Invalid OTP" });
      }
      // 4. Check expiry
      if (Date.now() > user.otpExpired) {
        user.otp = null;
        await user.save();
        return res.status(400).json({ message: "OTP expired!" });
      }
      // 5. Update verification status
      user.isOtpVerify = true;
      user.otp = null;
      await user.save();
      return res.status(200).json({
        message: "User OTP verified successfully!",
        status_code: 200
      });
    } catch (error) {
      return res.status(500).json({ message: "Server error" });
    }
  },

  resetPassword: async (req, res) => {
    try {
      const { email, newPassword } = req.body;
      const user = await User.findOne({ email });
      if (user?.email !== email) {
        return res.status(400).json({ message: "User does not matched!" });
      }
      if (user?.isOtpVerify == false) {
        res.status(400).json({ message: "OTP not verified!" });
      }
      const hashPassword = await bcrypt.hash(newPassword, 10);
      await User.findOneAndUpdate({ email }, { password: hashPassword }, { new: true });
      res.status(200).json({ message: "User reset password successfully!", status_code: 200 });
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  },
  
  changePassword: async (req, res) => {
    try {
      const userId = req.user.id; // authMiddleware se aata hai
      const { oldPassword, newPassword, confirmPassword } = req.body;

      // Validate input
      if (!oldPassword || !newPassword || !confirmPassword) {
        return res.status(400).json({
          message: "All fields are required",
        });
      }

      if (newPassword !== confirmPassword) {
        return res.status(400).json({
          message: "New password and confirm password do not match",
        });
      }

      // Find user
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          message: "User not found",
        });
      }

      // Verify old password
      const isMatch = await bcrypt.compare(oldPassword, user.password);
      if (!isMatch) {
        return res.status(401).json({
          message: "Old password is incorrect",
        });
      }

      // Hash & update new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      user.password = hashedPassword;

      await user.save();

      // Success
      res.status(200).json({
        message: "Password changed successfully",
      });
    } catch (error) {
      console.error("Change password error:", error);
      res.status(500).json({
        message: "Server error",
      });
    }
  },
}


