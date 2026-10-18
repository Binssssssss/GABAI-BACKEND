import { Router } from "express";
import { z } from "zod";

import * as accountController from "@/controllers/account.controller";
import { validate } from "@/middleware/validation.middleware";
import { authMiddleware } from "@/middleware/auth.middleware";

const router = Router();

router.use(authMiddleware);

const notificationPrefsSchema = z.object({
  pushEnabled: z.boolean(),
  taskDeadlines: z.boolean(),
  calendarReminders: z.boolean(),
  smartReminders: z.boolean(),
  focusAlerts: z.boolean(),
  leadMinutes: z.union([z.literal(15), z.literal(60), z.literal(1440)]),
  // Calendar alarm (snooze) settings.
  snoozeEnabled: z.boolean().optional(),
  snoozeMinutes: z.union([z.literal(5), z.literal(10), z.literal(15), z.literal(30)]).optional(),
  ringCount: z.union([z.literal(1), z.literal(3), z.literal(5)]).optional(),
});

// Profile: name and photo. The photo is a small data URL (about 300 KB max).
const MAX_AVATAR_LENGTH = 400_000;

const updateProfileSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(80, "Name is too long")
    .optional(),
  avatar: z
    .string()
    .max(MAX_AVATAR_LENGTH, "Photo is too large. Please choose a smaller photo.")
    .regex(/^data:image\/(jpeg|jpg|png|webp);base64,/, "Invalid photo format")
    .nullable()
    .optional(),
});

router.get("/profile", accountController.getProfile);
router.patch("/profile", validate(updateProfileSchema), accountController.updateProfile);

router.get("/notification-preferences", accountController.getNotificationPreferences);
router.put(
  "/notification-preferences",
  validate(notificationPrefsSchema),
  accountController.updateNotificationPreferences,
);

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
});

router.post(
  "/change-password",
  validate(changePasswordSchema),
  accountController.changePassword,
);

const deleteAccountSchema = z.object({
  confirmation: z.literal("DELETE"),
});

router.delete("/", validate(deleteAccountSchema), accountController.deleteAccount);

export default router;