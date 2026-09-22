import { Router } from "express";
import { authMiddleware } from "@/middleware/auth.middleware";
import { getSmartReminder } from "@/controllers/smart-reminder.controller";

const router = Router();

router.get(
  "/",
  authMiddleware,
  getSmartReminder,
);

export default router;