import { Router } from "express";
import { authMiddleware } from "@/middleware/auth.middleware";
import { getTodaysFocus } from "@/controllers/todays-focus.controller";

const router = Router();

router.get(
  "/",
  authMiddleware,
  getTodaysFocus,
);

export default router;