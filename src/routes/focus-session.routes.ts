import { Router } from "express";

import {
  focusSessionController,
} from "@/controllers/focus-session.controller";

import {
  authMiddleware,
} from "@/middleware/auth.middleware";

const router = Router();

router.get(
  "/current",
  authMiddleware,
  focusSessionController.getCurrentSession,
);

router.post(
  "/start",
  authMiddleware,
  focusSessionController.startSession,
);

router.patch(
  "/:id/pause",
  authMiddleware,
  focusSessionController.pauseSession,
);

router.patch(
  "/:id/resume",
  authMiddleware,
  focusSessionController.resumeSession,
);

router.patch(
  "/:id/complete",
  authMiddleware,
  focusSessionController.completeSession,
);

router.patch(
  "/:id/cancel",
  authMiddleware,
  focusSessionController.cancelSession,
);

export default router;