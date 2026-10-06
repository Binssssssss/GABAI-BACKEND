import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { getRecentActivities, createRecentActivity, deleteRecentActivity, } from "../controllers/recent-activity.controller.js";
const router = Router();
router.get("/", authMiddleware, getRecentActivities);
router.post("/", authMiddleware, createRecentActivity);
router.delete("/:id", authMiddleware, deleteRecentActivity);
export default router;
//# sourceMappingURL=recent-activity.routes.js.map