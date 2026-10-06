import { Router } from "express";
import { academicPressureController } from "../controllers/academic-pressure.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
const router = Router();
router.get("/", authMiddleware, academicPressureController.getAcademicPressure);
export default router;
//# sourceMappingURL=academic-pressure.routes.js.map