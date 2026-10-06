import { Router } from "express";
import { dashboardController, } from "../controllers/dashboard.controller.js";
import { authMiddleware, } from "../middleware/auth.middleware.js";
const router = Router();
router.get("/", authMiddleware, dashboardController.getDashboard.bind(dashboardController));
export default router;
//# sourceMappingURL=dashboard.routes.js.map