import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { getTodaysFocus } from "../controllers/todays-focus.controller.js";
const router = Router();
router.get("/", authMiddleware, getTodaysFocus);
export default router;
//# sourceMappingURL=todays-focus.routes.js.map