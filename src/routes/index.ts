import { Router } from "express";

import authRoutes from "./auth.routes";
import taskRoutes from "./task.routes";
import subjectRoutes from "./subject.routes";
import academicPressureRoutes from "./academicPressure.routes";
import notificationRoutes from "./notification.routes";
import transactionRoutes from "./transaction.routes";

const router = Router();

router.use("/academic-pressure", academicPressureRoutes);
router.use("/auth", authRoutes);
router.use("/tasks", taskRoutes);
router.use("/subjects", subjectRoutes);
router.use("/notifications", notificationRoutes);
router.use("/transactions", transactionRoutes);

export default router;