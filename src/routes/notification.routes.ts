import { Router } from "express";
import * as notificationController from "@/controllers/notification.controller";
import * as pushTokenController from "@/controllers/push-token.controller";
import { authMiddleware } from "@/middleware/auth.middleware";

const router = Router();

router.get("/test", (_req, res) => {
  res.json({
    success: true,
    message: "Notification route is working",
  });
});

router.use(authMiddleware);

router.post("/push-token", notificationController.registerPushToken);

// Must come before "/:id", or "push-token" is read as a notification id
// and logging out never removes the phone's push token (404).
router.delete("/push-token", pushTokenController.deletePushToken);

router.get("/", notificationController.getNotifications);

router.get("/:id", notificationController.getNotificationById);

router.post("/", notificationController.createNotification);

router.patch("/read-all", notificationController.markAllNotificationsAsRead);

router.patch("/:id/read", notificationController.markNotificationAsRead);

router.delete("/:id", notificationController.deleteNotification);

export default router;
