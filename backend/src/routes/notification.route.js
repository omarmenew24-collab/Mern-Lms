import express from "express";
import { protectRoute, adminOrTeacherOnly } from "../middlewares/auth.middleware.js";
import {
  getNotifications,
  getUnreadCount,
  markOneRead,
  markAllRead,
  deleteOne,
  sendAnnouncements,
} from "../controllers/notification.controller.js";

const router = express.Router();

router.post("/notifications/send", protectRoute, adminOrTeacherOnly, sendAnnouncements);
router.get("/notifications/unread-count", protectRoute, getUnreadCount);
router.get("/notifications", protectRoute, getNotifications);
router.patch("/notifications/read-all", protectRoute, markAllRead);
router.patch("/notifications/:id/read", protectRoute, markOneRead);
router.delete("/notifications/:id", protectRoute, deleteOne);

export default router;
