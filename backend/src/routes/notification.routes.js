import express from "express";
import protect from "../middlewares/auth.middleware.js";
import {
  getMyNotifications,
  markAsRead,
  markAllAsRead,
  countNotifications,
  deleteNotification
} from "../controllers/notification.controller.js";

const router = express.Router();

router.get("/my", protect, getMyNotifications);
router.patch("/read/:id", protect, markAsRead);
router.patch("/read-all", protect, markAllAsRead);
router.get("/countNotifications", protect, countNotifications);
router.delete("/deleteNotification/:id", protect, deleteNotification);

export default router;
