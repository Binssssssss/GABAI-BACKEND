import { Router } from "express";
import { taskController } from "../controllers/task.controller";
import notificationRoutes from "@/routes/notification.routes";
import { authMiddleware } from "@/middleware/auth.middleware";
import { taskRouter } from "./task.routes";
import academicPressureRoutes from "./academic-pressure.routes";
import authRoutes from "./auth.routes";
import focusSessionRoutes from "@/routes/focus-session.routes";
const router = Router();
router.use("/auth", authRoutes);
/*
 * Everything below requires authentication.
 */
router.use(authMiddleware);
/*
 * Get all tasks for logged-in user
 */
router.get("/", taskController.getAllTasks.bind(taskController));
/*
 * Get tasks for a specific date
 *
 * Example:
 * /api/tasks/date/2026-09-19
 */
router.get("/date/:date", taskController.getTasksByDate.bind(taskController));
/*
 * Get one task
 */
router.get("/:id", taskController.getTaskById.bind(taskController));
/*
 * Create task
 */
router.post("/", taskController.createTask.bind(taskController));
/*
 * Update task
 */
router.patch("/:id", taskController.updateTask.bind(taskController));
/*
 * Delete task
 */
router.delete("/:id", taskController.deleteTask.bind(taskController));
router.use("/tasks", taskRouter);
router.use("/academic-pressure", academicPressureRoutes);
router.use("/notifications", notificationRoutes);
router.use("/focus-sessions", focusSessionRoutes);
export default router;
//# sourceMappingURL=index.js.map