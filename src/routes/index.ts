import { Router } from "express";

import authRoutes from "./auth.routes";
import taskRoutes from "./task.routes";
import subjectRoutes from "./subject.routes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/tasks", taskRoutes);
router.use("/subjects", subjectRoutes);

export default router;