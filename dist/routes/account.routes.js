import { Router } from "express";
import { z } from "zod";
import * as accountController from "../controllers/account.controller.js";
import { validate } from "../middleware/validation.middleware.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
const router = Router();
router.use(authMiddleware);
const notificationPrefsSchema = z.object({
    pushEnabled: z.boolean(),
    taskDeadlines: z.boolean(),
    calendarReminders: z.boolean(),
    smartReminders: z.boolean(),
    focusAlerts: z.boolean(),
    leadMinutes: z.union([z.literal(15), z.literal(60), z.literal(1440)]),
});
router.get("/notification-preferences", accountController.getNotificationPreferences);
router.put("/notification-preferences", validate(notificationPrefsSchema), accountController.updateNotificationPreferences);
const changePasswordSchema = z.object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(8, "Password must be at least 8 characters"),
});
router.post("/change-password", validate(changePasswordSchema), accountController.changePassword);
const deleteAccountSchema = z.object({
    confirmation: z.literal("DELETE"),
});
router.delete("/", validate(deleteAccountSchema), accountController.deleteAccount);
export default router;
//# sourceMappingURL=account.routes.js.map