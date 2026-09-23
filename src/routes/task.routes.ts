import { Router } from "express";

import { authMiddleware } from "@/middleware/auth.middleware";
import { taskController } from "@/controllers/task.controller";

const router = Router();

// ===============================
// TASK ROUTES
// ===============================

// Get all tasks
router.get(
  "/",
  authMiddleware,
  taskController.getAllTasks.bind(taskController),
);

// Get upcoming tasks
router.get(
  "/upcoming",
  authMiddleware,
  taskController.getUpcomingDeadlines.bind(taskController),
);

// Get tasks by date
router.get(
  "/date/:date",
  authMiddleware,
  taskController.getTasksByDate.bind(taskController),
);

// Create task
router.post(
  "/",
  authMiddleware,
  taskController.createTask.bind(taskController),
);

// Update subtask checklist
router.patch(
  "/:id/subtasks/:subTaskId",
  authMiddleware,
  taskController.updateSubTask.bind(taskController),
);

// Reschedule task
router.patch(
  "/:id/reschedule",
  authMiddleware,
  taskController.rescheduleTask.bind(taskController),
);

// Get task by ID
router.get(
  "/:id",
  authMiddleware,
  taskController.getTaskById.bind(taskController),
);

// Update task
router.put(
  "/:id",
  authMiddleware,
  taskController.updateTask.bind(taskController),
);

// Delete task
router.delete(
  "/:id",
  authMiddleware,
  taskController.deleteTask.bind(taskController),
);

export default router;