import { Router } from "express";
import * as notificationController from "../controllers/notification.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
const router = Router();
router.get("/test", (_req, res) => {
    res.json({
        success: true,
        message: "Notification route is working",
    });
});
router.use(authMiddleware);
router.get("/", notificationController.getNotifications);
router.get("/:id", notificationController.getNotificationById);
router.post("/", notificationController.createNotification);
router.patch("/read-all", notificationController.markAllNotificationsAsRead);
router.patch("/:id/read", notificationController.markNotificationAsRead);
router.delete("/:id", notificationController.deleteNotification);
export default router;
//# sourceMappingURL=notification.routes.js.map