import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { getSmartReminder } from "../controllers/smart-reminder.controller.js";
const router = Router();
router.get("/", authMiddleware, getSmartReminder);
export default router;
//# sourceMappingURL=smart-reminder.routes.js.map