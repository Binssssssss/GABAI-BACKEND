import { Router } from "express";
import { z } from "zod";

import * as taskController from "@/controllers/task.controller";
import { authMiddleware } from "@/middlewares/authenticate-token";
import { validate } from "@/middlewares/validate-schema";

const router = Router();

const createTaskSchema = z.object({
  title: z.string().min(1, "Title is required"),

  description: z.string().optional(),

  subject: z.string().min(1, "Subject is required"),

  priority: z.enum(["High", "Medium", "Low"]),

  dueDate: z.string().min(1, "Due date is required"),

  dueTime: z.string().min(1, "Due time is required"),

  hasReminder: z.boolean().optional(),

  subTasks: z.array(z.string().min(1)).optional(),
});

const updateTaskSchema = z.object({
  title: z.string().min(1).optional(),

  description: z.string().optional(),

  subject: z.string().min(1).optional(),

  priority: z.enum(["High", "Medium", "Low"]).optional(),

  dueDate: z.string().min(1).optional(),

  dueTime: z.string().min(1).optional(),

  hasReminder: z.boolean().optional(),

  completed: z.boolean().optional(),

  subTasks: z.array(z.string().min(1)).optional(),
});

// All task routes require authentication
router.use(authMiddleware);

// GET /api/tasks
router.get("/", taskController.getTasks);

// GET /api/tasks/:id
router.get("/:id", taskController.getTaskById);

// POST /api/tasks
router.post(
  "/",
  validate(createTaskSchema),
  taskController.createTask
);

// PATCH /api/tasks/:id
router.patch(
  "/:id",
  validate(updateTaskSchema),
  taskController.updateTask
);

// DELETE /api/tasks/:id
router.delete(
  "/:id",
  taskController.deleteTask
);

export default router;