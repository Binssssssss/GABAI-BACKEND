
import { prisma } from "../lib/prisma";

import {
  CreateTaskInput,
  UpdateTaskInput,
  TaskFilters,
  RescheduleTaskInput,
  UpdateSubTaskInput,
} from "../types/task.types";

export class TaskRepository {
  // ===============================
  // GET ALL TASKS
  // ===============================

  async findAllByUser(
    userId: string,
    filters?: TaskFilters,
  ) {
    return prisma.task.findMany({
      where: {
        userId,

        ...(filters?.search && {
          OR: [
            {
              title: {
                contains: filters.search,
                mode: "insensitive",
              },
            },
            {
              description: {
                contains: filters.search,
                mode: "insensitive",
              },
            },
            {
              subject: {
                contains: filters.search,
                mode: "insensitive",
              },
            },
          ],
        }),

        ...(filters?.category &&
          filters.category !== "All" && {
          subject: filters.category,
        }),

        ...(filters?.date && {
          dueDate: filters.date,
        }),
      },

      include: {
        subTasks: true,
      },

      orderBy: [
        { dueDate: "asc" },
        { dueTime: "asc" },
      ],
    });
  }

  // ===============================
  // GET TASKS BY FILTER
  // ===============================

  async findByFilter(
    userId: string,
    filter: string,
  ) {
    const today = new Date()
      .toLocaleDateString("en-CA", {
        timeZone: "Asia/Manila",
      });

    switch (filter.toLowerCase()) {
      case "all":
        return prisma.task.findMany({
          where: { userId },
          include: { subTasks: true },
          orderBy: [
            { dueDate: "asc" },
            { dueTime: "asc" },
          ],
        });

      case "today":
        return prisma.task.findMany({
          where: {
            userId,
            dueDate: today,
          },
          include: { subTasks: true },
          orderBy: { dueTime: "asc" },
        });

      case "upcoming":
        return prisma.task.findMany({
          where: {
            userId,
            completed: false,
            dueDate: { gt: today },
          },
          include: { subTasks: true },
          orderBy: [
            { dueDate: "asc" },
            { dueTime: "asc" },
          ],
        });

      case "completed":
        return prisma.task.findMany({
          where: {
            userId,
            completed: true,
          },
          include: { subTasks: true },
          orderBy: [
            { dueDate: "asc" },
            { dueTime: "asc" },
          ],
        });

      case "pending":
        return prisma.task.findMany({
          where: {
            userId,
            completed: false,
          },
          include: { subTasks: true },
          orderBy: [
            { dueDate: "asc" },
            { dueTime: "asc" },
          ],
        });

      case "overdue":
        return prisma.task.findMany({
          where: {
            userId,
            completed: false,
            dueDate: { lt: today },
          },
          include: { subTasks: true },
          orderBy: [
            { dueDate: "asc" },
            { dueTime: "asc" },
          ],
        });

      default:
        return [];
    }
  }

  // ===============================
  // GET TASK BY ID
  // ===============================

  async findById(
    id: string,
    userId: string,
  ) {
    return prisma.task.findFirst({
      where: {
        id,
        userId,
      },
      include: {
        subTasks: true,
      },
    });
  }

  // ===============================
  // GET TASKS BY DATE
  // ===============================

  async findByDate(
    userId: string,
    date: string,
  ) {
    return prisma.task.findMany({
      where: {
        userId,
        dueDate: date,
      },
      include: {
        subTasks: true,
      },
      orderBy: {
        dueTime: "asc",
      },
    });
  }

  // ===============================
  // CREATE TASK
  // ===============================

  async create(
    userId: string,
    data: CreateTaskInput,
  ) {
    const title =
      typeof data.title === "string"
        ? data.title.trim()
        : "";

    if (!title) {
      const error = new Error(
        "Task title is required.",
      );

      Object.assign(error, {
        statusCode: 400,
      });

      throw error;
    }

    const rawSubTasks: unknown = data.subTasks;

    const validSubTasks = Array.isArray(rawSubTasks)
      ? rawSubTasks
          .filter(
            (item): item is Record<string, unknown> =>
              typeof item === "object" &&
              item !== null,
          )
          .map((item) => {
            const subTaskTitle =
              typeof item.title === "string"
                ? item.title.trim()
                : typeof item.text === "string"
                  ? item.text.trim()
                  : typeof item.label === "string"
                    ? item.label.trim()
                    : "";

            return {
              title: subTaskTitle,
              completed:
                typeof item.completed === "boolean"
                  ? item.completed
                  : false,
            };
          })
          .filter(
            (item) => item.title.length > 0,
          )
      : [];

    return prisma.task.create({
      data: {
        title,
        description: data.description ?? "",
        subject: data.subject,
        priority: data.priority,
        dueDate: data.dueDate,
        dueTime: data.dueTime ?? "",
        duration: data.duration ?? 0,
        hasReminder: data.hasReminder ?? false,
        completed: data.completed ?? false,
        userId,

        ...(validSubTasks.length > 0 && {
          subTasks: {
            create: validSubTasks,
          },
        }),
      },

      include: {
        subTasks: true,
      },
    });
  }

  // ===============================
  // UPDATE TASK
  // ===============================

  async update(
    id: string,
    userId: string,
    data: UpdateTaskInput,
  ) {
    const task = await prisma.task.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!task) {
      return null;
    }

    const deadlineChanged =
      (data.dueDate !== undefined &&
        data.dueDate !== task.dueDate) ||
      (data.dueTime !== undefined &&
        data.dueTime !== task.dueTime);

    const reminderSettingChanged =
      data.hasReminder !== undefined &&
      data.hasReminder !== task.hasReminder;

    const reopened =
      data.completed === false &&
      task.completed === true;

    const shouldResetReminder =
      deadlineChanged ||
      reminderSettingChanged ||
      reopened;

    return prisma.task.update({
      where: {
        id,
      },

      data: {
        ...(data.title !== undefined && {
          title: data.title,
        }),

        ...(data.description !== undefined && {
          description: data.description,
        }),

        ...(data.subject !== undefined && {
          subject: data.subject,
        }),

        ...(data.priority !== undefined && {
          priority: data.priority,
        }),

        ...(data.dueDate !== undefined && {
          dueDate: data.dueDate,
        }),

        ...(data.dueTime !== undefined && {
          dueTime: data.dueTime,
        }),

        ...(data.hasReminder !== undefined && {
          hasReminder: data.hasReminder,
        }),

        ...(data.completed !== undefined && {
          completed: data.completed,
        }),

        ...(shouldResetReminder && {
          reminderSentAt: null,
        }),
      },

      include: {
        subTasks: true,
      },
    });
  }

  // ===============================
  // DELETE TASK
  // ===============================

  async delete(
    id: string,
    userId: string,
  ) {
    const task = await prisma.task.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!task) {
      return null;
    }

    return prisma.task.delete({
      where: {
        id,
      },
    });
  }

  // ===============================
  // UPCOMING DEADLINES
  // ===============================

  async findUpcomingDeadlines(
    userId: string,
    limit = 3,
  ) {
    const today = new Date()
      .toLocaleDateString("en-CA", {
        timeZone: "Asia/Manila",
      });

    return prisma.task.findMany({
      where: {
        userId,
        completed: false,
        dueDate: {
          gte: today,
        },
      },

      include: {
        subTasks: true,
      },

      orderBy: [
        { dueDate: "asc" },
        { dueTime: "asc" },
      ],

      take: limit,
    });
  }

  // ===============================
  // RESCHEDULE TASK
  // ===============================

  async reschedule(
    id: string,
    userId: string,
    data: RescheduleTaskInput,
  ) {
    const task = await prisma.task.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!task) {
      return null;
    }

    const deadlineChanged =
      data.dueDate !== task.dueDate ||
      (data.dueTime !== undefined &&
        data.dueTime !== task.dueTime);

    return prisma.task.update({
      where: {
        id,
      },

      data: {
        dueDate: data.dueDate,

        ...(data.dueTime !== undefined && {
          dueTime: data.dueTime,
        }),

        ...(deadlineChanged && {
          reminderSentAt: null,
        }),
      },

      include: {
        subTasks: true,
      },
    });
  }

  // ===============================
  // UPDATE SUBTASK
  // ===============================

  async updateSubTask(
    userId: string,
    taskId: string,
    subTaskId: string,
    data: UpdateSubTaskInput,
  ) {
    const subTask = await prisma.subTask.findFirst({
      where: {
        id: subTaskId,
        taskId,
        task: {
          userId,
        },
      },
    });

    if (!subTask) {
      return null;
    }

    return prisma.subTask.update({
      where: {
        id: subTaskId,
      },

      data: {
        completed: data.completed,
      },
    });
  }

  // ===============================
  // BULK COMPLETE TASKS
  // ===============================

  async bulkComplete(
    taskIds: string[],
    userId: string,
  ) {
    return prisma.task.updateMany({
      where: {
        id: {
          in: taskIds,
        },
        userId,
      },

      data: {
        completed: true,
        reminderSentAt: null,
      },
    });
  }

  // ===============================
  // BULK DELETE TASKS
  // ===============================

  async bulkDelete(
    taskIds: string[],
    userId: string,
  ) {
    return prisma.task.deleteMany({
      where: {
        id: {
          in: taskIds,
        },
        userId,
      },
    });
  }

  // ===============================
  // TASK ANALYTICS
  // ===============================

  async getAnalytics(userId: string) {
    const [
      totalTasks,
      completedTasks,
      pendingTasks,
      tasks,
    ] = await Promise.all([
      prisma.task.count({
        where: {
          userId,
        },
      }),

      prisma.task.count({
        where: {
          userId,
          completed: true,
        },
      }),

      prisma.task.count({
        where: {
          userId,
          completed: false,
        },
      }),

      prisma.task.findMany({
        where: {
          userId,
        },

        select: {
          id: true,
          completed: true,
          dueDate: true,
          createdAt: true,
        },

        orderBy: {
          dueDate: "asc",
        },
      }),
    ]);

    return {
      totalTasks,
      completedTasks,
      pendingTasks,
      tasks,
    };
  }
}

// ===============================
// REPOSITORY INSTANCE
// ===============================

export const taskRepository = new TaskRepository();
