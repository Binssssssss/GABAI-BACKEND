import { Router } from "express";
import { academicPressureController } from "@/controllers/academic-pressure.controller";
import { authMiddleware } from "@/middleware/auth.middleware";
const router = Router();
router.get("/", authMiddleware, academicPressureController.getAcademicPressure);
export default router;
//# sourceMappingURL=academic-pressure.routes.js.map