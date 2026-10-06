import { Router } from "express";
import * as academicPressureController from "../controllers/academicPressure.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
const router = Router();
// All academic pressure routes require authentication
router.use(authMiddleware);
// GET /api/academic-pressure
router.get("/", academicPressureController.getAcademicPressure);
export default router;
//# sourceMappingURL=academicPressure.routes.js.map