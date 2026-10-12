import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { getSubjectProgress } from "../controllers/subject-progress.controller.js";
const router = Router();
router.get("/", authMiddleware, getSubjectProgress);
export default router;
//# sourceMappingURL=subject-progress.routes.js.map