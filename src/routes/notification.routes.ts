import { Router } from "express";

import {
  notificationController,
} from "@/controllers/notification.controller";

import {
  authMiddleware,
} from "@/middleware/auth.middleware";

const router = Router();

router.get(
  "/",
  authMiddleware,
  notificationController.getNotifications,
);

router.post(
  "/",
  authMiddleware,
  notificationController.createNotification,
);

router.patch(
  "/read-all",
  authMiddleware,
  notificationController.markAllAsRead,
);

router.patch(
  "/:id/read",
  authMiddleware,
  notificationController.markAsRead,
);

router.delete(
  "/:id",
  authMiddleware,
  notificationController.deleteNotification,
);

export default router;