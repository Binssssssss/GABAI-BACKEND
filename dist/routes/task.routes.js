import { Router } from "express";
import { taskController } from "../controllers/task.controller";
import { authMiddleware } from "@/middleware/auth.middleware";
const router = Router();
/*
 * Everything below requires authentication.
 */
router.use(authMiddleware);
router.get("/upcoming", taskController.getUpcomingDeadlines.bind(taskController));
router.get("/", taskController.getAllTasks.bind(taskController));
router.get("/date/:date", taskController.getTasksByDate.bind(taskController));
router.get("/:id", taskController.getTaskById.bind(taskController));
router.post("/", taskController.createTask.bind(taskController));
router.patch("/:id", taskController.updateTask.bind(taskController));
router.delete("/:id", taskController.deleteTask.bind(taskController));
export { router as taskRouter };
//# sourceMappingURL=task.routes.js.map