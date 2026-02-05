import express from 'express';
const router = express.Router();
import authController from '../controllers/auth.controller.js';
import protect from '../middlewares/auth.middleware.js';
// Register
router.post("/register", authController.register);
// Login
router.post("/login", authController.login);
// Auto-login
// router.get("/me", protect, authController.autoLogin);
// Logout
router.post("/logout", protect, authController.logout);
router.get("/myProfile", protect, authController.myProfile);
router.post('/forgot-password', protect, authController.forgotPassword);
router.post('/verify-otp', protect, authController.verifyOTP);
router.post('/reset-password', protect, authController.resetPassword);
export default router;
