import { Router } from "express";

import authRoutes from "./auth.routes";
import taskRoutes from "./task.routes";
import notificationRoutes from "./notification.routes";
import focusSessionRoutes from "./focus-session.routes";
import dashboardRoutes from "./dashboard.routes";
import recentActivityRoutes from "./recent-activity.routes";
import academicPressureRoutes from "./academic-pressure.routes";
import smartReminderRoutes from "./smart-reminder.routes";
import subjectProgressRoutes from "./subject-progress.routes";
import todaysFocusRoutes from "./todays-focus.routes";
const router = Router();

router.use("/auth", authRoutes);
router.use("/tasks", taskRoutes);
router.use("/notifications", notificationRoutes);
router.use("/focus-sessions", focusSessionRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/recent-activities", recentActivityRoutes);
router.use("/academic-pressure", academicPressureRoutes);
router.use("/smart-reminders", smartReminderRoutes);
router.use("/subject-progress", subjectProgressRoutes);
router.use("/dashboard/todays-focus", todaysFocusRoutes);
export default router;