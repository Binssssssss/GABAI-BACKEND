import {
  Request,
  Response,
  NextFunction,
} from "express";

import {
  taskService,
} from "../services/task.service";

export class TaskController {
  // ===============================
  // GET ALL TASKS
  // ===============================

  async getAllTasks(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const userId =
        typeof req.user?.id === "string"
          ? req.user.id
          : undefined;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      const search =
        typeof req.query.search === "string"
          ? req.query.search
          : undefined;

      const category =
        typeof req.query.category === "string"
          ? req.query.category
          : undefined;

      const date =
        typeof req.query.date === "string"
          ? req.query.date
          : undefined;

      const tasks =
        await taskService.getAllTasks(
          userId,
          {
            search,
            category,
            date,
          },
        );

      return res.status(200).json({
        success: true,
        data: tasks,
      });
    } catch (error) {
      next(error);
    }
  }

  // ===============================
  // GET TASKS BY FILTER
  // ===============================

  async getTasksByFilter(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const userId =
        typeof req.user?.id === "string"
          ? req.user.id
          : undefined;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      const filter =
        typeof req.query.filter === "string"
          ? req.query.filter
          : "all";

      const tasks =
        await taskService.getTasksByFilter(
          userId,
          filter,
        );

      return res.status(200).json({
        success: true,
        data: tasks,
      });
    } catch (error) {
      next(error);
    }
  }

  // ===============================
  // UPDATE SUBTASK
  // ===============================

  async updateSubTask(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const userId =
        typeof req.user?.id === "string"
          ? req.user.id
          : undefined;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      const taskId = Array.isArray(req.params.id)
        ? req.params.id[0]
        : req.params.id;

      if (typeof taskId !== "string") {
        return res.status(400).json({
          success: false,
          message: "Invalid task ID",
        });
      }

      const subTaskId =
        typeof req.params.subTaskId === "string"
          ? req.params.subTaskId
          : undefined;

      if (!subTaskId) {
        return res.status(400).json({
          success: false,
          message: "Invalid subtask ID",
        });
      }

      const { completed } = req.body;

      if (typeof completed !== "boolean") {
        return res.status(400).json({
          success: false,
          message: "completed must be a boolean",
        });
      }

      const updatedTask =
        await taskService.updateSubTask(
          userId,
          taskId,
          subTaskId,
          {
            completed,
          },
        );

      return res.status(200).json({
        success: true,
        message:
          "Subtask updated successfully",
        data: updatedTask,
      });
    } catch (error) {
      next(error);
    }
  }

  // ===============================
  // GET TASKS BY DATE
  // ===============================

  async getTasksByDate(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const userId =
        typeof req.user?.id === "string"
          ? req.user.id
          : undefined;

      const date =
        typeof req.params.date === "string"
          ? req.params.date
          : undefined;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      if (!date) {
        return res.status(400).json({
          success: false,
          message: "Date is required",
        });
      }

      const tasks =
        await taskService.getTasksByDate(
          userId,
          date,
        );

      return res.status(200).json({
        success: true,
        data: tasks,
      });
    } catch (error) {
      next(error);
    }
  }

  // ===============================
  // GET TASK BY ID
  // ===============================

async getTaskById(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const userId = req.user?.id;
    const taskId = Array.isArray(req.params.id)
      ? req.params.id[0]
      : req.params.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    if (!taskId) {
      return res.status(400).json({
        success: false,
        message: "Invalid task ID",
      });
    }

    console.log("========== CONTROLLER DEBUG ==========");
    console.log("taskId:", taskId);
    console.log("userId:", userId);
    console.log("======================================");

    const task = await taskService.getTaskById(taskId, userId);

    return res.status(200).json({
      success: true,
      data: task,
    });
  } catch (error) {
    next(error);
  }
}

  // ===============================
  // CREATE TASK
  // ===============================

  async createTask(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const userId =
        typeof req.user?.id === "string"
          ? req.user.id
          : undefined;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      const task =
        await taskService.createTask(
          userId,
          req.body,
        );

      return res.status(201).json({
        success: true,
        message:
          "Task created successfully",
        data: task,
      });
    } catch (error) {
      next(error);
    }
  }

  // ===============================
  // UPDATE TASK
  // ===============================

  async updateTask(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const userId =
        typeof req.user?.id === "string"
          ? req.user.id
          : undefined;

      const { id } = req.params;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      if (typeof id !== "string") {
        return res.status(400).json({
          success: false,
          message: "Invalid task ID",
        });
      }

      const task =
        await taskService.updateTask(
          userId,
          id,
          req.body,
        );

      return res.status(200).json({
        success: true,
        message:
          "Task updated successfully",
        data: task,
      });
    } catch (error) {
      next(error);
    }
  }

  // ===============================
  // DELETE TASK
  // ===============================

  async deleteTask(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const userId =
        typeof req.user?.id === "string"
          ? req.user.id
          : undefined;

      const { id } = req.params;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      const taskId =
        typeof id === "string"
          ? id
          : id[0];

      const result =
        await taskService.deleteTask(
          userId,
          taskId,
        );

      return res.status(200).json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }

  // ===============================
  // UPCOMING DEADLINES
  // ===============================

  async getUpcomingDeadlines(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const userId =
        typeof req.user?.id === "string"
          ? req.user.id
          : undefined;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      const deadlines =
        await taskService.getUpcomingDeadlines(
          userId,
        );

      return res.status(200).json({
        success: true,
        data: deadlines,
      });
    } catch (error) {
      next(error);
    }
  }

  // ===============================
  // RESCHEDULE TASK
  // ===============================

  async rescheduleTask(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const userId =
        typeof req.user?.id === "string"
          ? req.user.id
          : undefined;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      const taskId = Array.isArray(req.params.id)
        ? req.params.id[0]
        : req.params.id;

      if (typeof taskId !== "string") {
        return res.status(400).json({
          success: false,
          message: "Invalid task ID",
        });
      }

      const {
        dueDate,
        dueTime,
      } = req.body;

      if (
        typeof dueDate !== "string" ||
        !dueDate.trim()
      ) {
        return res.status(400).json({
          success: false,
          message: "dueDate is required",
        });
      }

      const updatedTask =
        await taskService.rescheduleTask(
          userId,
          taskId,
          {
            dueDate,
            dueTime,
          },
        );

      return res.status(200).json({
        success: true,
        message:
          "Task rescheduled successfully",
        data: updatedTask,
      });
    } catch (error) {
      next(error);
    }
  }

  // ===============================
  // CONVERT NOTE TO TASK
  // ===============================

  async convertNoteToTask(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const userId =
        typeof req.user?.id === "string"
          ? req.user.id
          : undefined;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      const {
        noteId,
        title,
        description,
        subject,
        priority,
        dueDate,
        dueTime,
        hasReminder,
      } = req.body;

      if (!noteId) {
        return res.status(400).json({
          success: false,
          message: "Note ID is required",
        });
      }

      if (
        typeof title !== "string" ||
        !title.trim()
      ) {
        return res.status(400).json({
          success: false,
          message: "Task title is required",
        });
      }

      if (
        typeof subject !== "string" ||
        !subject.trim()
      ) {
        return res.status(400).json({
          success: false,
          message: "Subject is required",
        });
      }

      if (!priority) {
        return res.status(400).json({
          success: false,
          message: "Priority is required",
        });
      }

      const task =
        await taskService.createTask(
          userId,
          {
            title: title.trim(),
            description:
              typeof description === "string"
                ? description
                : "",
            subject: subject.trim(),
            priority,
            dueDate:
              typeof dueDate === "string"
                ? dueDate
                : new Date(
                    Date.now() +
                      86400000 * 2,
                  )
                    .toISOString()
                    .split("T")[0],
            dueTime:
              typeof dueTime === "string"
                ? dueTime
                : "18:00",
            hasReminder:
              typeof hasReminder === "boolean"
                ? hasReminder
                : false,
            subTasks: [],
          },
        );

      return res.status(201).json({
        success: true,
        message:
          "Note converted to task successfully",
        data: task,
      });
    } catch (error) {
      next(error);
    }
  }

  // ===============================
  // BULK COMPLETE TASKS
  // ===============================

  async bulkCompleteTasks(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const userId =
        typeof req.user?.id === "string"
          ? req.user.id
          : undefined;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      const result =
        await taskService.bulkComplete(
          req.body,
          userId,
        );

      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  // ===============================
  // BULK DELETE TASKS
  // ===============================

  async bulkDeleteTasks(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const userId =
        typeof req.user?.id === "string"
          ? req.user.id
          : undefined;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      const result =
        await taskService.bulkDelete(
          req.body,
          userId,
        );

      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  // ===============================
  // GET TASK ANALYTICS
  // ===============================

  async getAnalytics(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const userId =
        typeof req.user?.id === "string"
          ? req.user.id
          : undefined;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      const analytics =
        await taskService.getAnalytics(
          userId,
        );

      return res.status(200).json({
        success: true,
        message:
          "Task analytics retrieved successfully",
        data: analytics,
      });
    } catch (error) {
      next(error);
    }
  }
}

// ===============================
// CONTROLLER INSTANCE
// ===============================

export const taskController =
  new TaskController();