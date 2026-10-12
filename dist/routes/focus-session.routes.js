import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { focusSessionController } from "../controllers/focus-session.controller.js";
const router = Router();
router.get("/stats", authMiddleware, focusSessionController.getFocusStats);
router.get("/history", authMiddleware, focusSessionController.getSessionHistory);
router.get("/current", authMiddleware, focusSessionController.getCurrentSession);
router.post("/start", authMiddleware, focusSessionController.startSession);
router.patch("/:id/strict", authMiddleware, focusSessionController.updateStrictMode);
router.patch("/:id", authMiddleware, focusSessionController.updateAmbientSound);
router.patch("/:id/pause", authMiddleware, focusSessionController.pauseSession);
router.patch("/:id/resume", authMiddleware, focusSessionController.resumeSession);
router.patch("/:id/complete", authMiddleware, focusSessionController.completeSession);
router.patch("/:id/cancel", authMiddleware, focusSessionController.cancelSession);
export default router;
//# sourceMappingURL=focus-session.routes.js.map