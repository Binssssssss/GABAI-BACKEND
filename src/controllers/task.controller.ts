import { Request, Response } from "express";
import { taskService } from "@/services/task.service";
import { asyncHandler } from "@/utils/helper";

export const getTasks = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user!.userId;

    const tasks = await taskService.getTasks(userId);

    return res.status(200).json(tasks);
  }
);

export const getTaskById = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const taskId = String(req.params.id);

    if (!taskId) {
      return res.status(400).json({
        message: "Task ID is required",
      });
    }

    const task = await taskService.getTaskById(
      taskId,
      userId
    );

    return res.status(200).json(task);
  }
);

export const createTask = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user!.userId;

    const task = await taskService.createTask(
      userId,
      req.body
    );

    return res.status(201).json(task);
  }
);

export const updateTask = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const taskId = String(req.params.id);

    if (!taskId) {
      return res.status(400).json({
        message: "Task ID is required",
      });
    }

    const task = await taskService.updateTask(
      taskId,
      userId,
      req.body
    );

    return res.status(200).json(task);
  }
);

export const deleteTask = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const taskId = String(req.params.id);

    if (!taskId) {
      return res.status(400).json({
        message: "Task ID is required",
      });
    }

    await taskService.deleteTask(
      taskId,
      userId
    );

    return res.status(200).json({
      message: "Task deleted successfully",
    });
  }
);