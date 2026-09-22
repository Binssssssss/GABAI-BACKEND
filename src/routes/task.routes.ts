import { Router } from "express";
import { authMiddleware } from "@/middleware/auth.middleware";
import { taskController } from "@/controllers/task.controller";

const router = Router();

router.get(
  "/",
  authMiddleware,
  taskController.getAllTasks,
);

router.get(
  "/:id",
  authMiddleware,
  taskController.getTaskById,
);

router.post(
  "/",
  authMiddleware,
  taskController.createTask,
);

router.put(
  "/:id",
  authMiddleware,
  taskController.updateTask,
);

router.delete(
  "/:id",
  authMiddleware,
  taskController.deleteTask,
);

export default router;