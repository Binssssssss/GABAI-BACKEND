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
        {
          dueDate: "asc",
        },
        {
          dueTime: "asc",
        },
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
      .toISOString()
      .split("T")[0];

    switch (filter.toLowerCase()) {
      case "all":
        return prisma.task.findMany({
          where: {
            userId,
          },

          include: {
            subTasks: true,
          },

          orderBy: [
            {
              dueDate: "asc",
            },
            {
              dueTime: "asc",
            },
          ],
        });

      case "today":
        return prisma.task.findMany({
          where: {
            userId,
            dueDate: today,
          },

          include: {
            subTasks: true,
          },

          orderBy: {
            dueTime: "asc",
          },
        });

      case "upcoming":
        return prisma.task.findMany({
          where: {
            userId,
            completed: false,
            dueDate: {
              gt: today,
            },
          },

          include: {
            subTasks: true,
          },

          orderBy: [
            {
              dueDate: "asc",
            },
            {
              dueTime: "asc",
            },
          ],
        });

      case "completed":
        return prisma.task.findMany({
          where: {
            userId,
            completed: true,
          },

          include: {
            subTasks: true,
          },

          orderBy: [
            {
              dueDate: "asc",
            },
            {
              dueTime: "asc",
            },
          ],
        });

      case "pending":
        return prisma.task.findMany({
          where: {
            userId,
            completed: false,
          },

          include: {
            subTasks: true,
          },

          orderBy: [
            {
              dueDate: "asc",
            },
            {
              dueTime: "asc",
            },
          ],
        });

      case "overdue":
        return prisma.task.findMany({
          where: {
            userId,
            completed: false,
            dueDate: {
              lt: today,
            },
          },

          include: {
            subTasks: true,
          },

          orderBy: [
            {
              dueDate: "asc",
            },
            {
              dueTime: "asc",
            },
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
    const task = await prisma.task.findUnique({
      where: {
        id,
      },

      include: {
        subTasks: true,
      },
    });

    // Task ID does not exist at all
    if (!task) {
      console.warn(
        `[TaskRepository] Task ID does not exist: ${id}`,
      );

      return null;
    }

    // Task exists but belongs to another user
    if (task.userId !== userId) {
      console.warn(
        `[TaskRepository] Task ownership mismatch. taskId=${id}, requestedUser=${userId}, owner=${task.userId}`,
      );

      return null;
    }

    return task;
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
    return prisma.task.create({
      data: {
        title: data.title,
        description: data.description ?? "",
        subject: data.subject,
        priority: data.priority,
        dueDate: data.dueDate,
        dueTime: data.dueTime ?? "",
        hasReminder: data.hasReminder ?? false,
        completed: data.completed ?? false,
        userId,

        subTasks: {
          create:
            data.subTasks?.map((subTask) => ({
              title: subTask.title,
              completed: subTask.completed ?? false,
            })) ?? [],
        },
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
    const task = await prisma.task.findUnique({
      where: {
        id,
      },
    });

    if (!task || task.userId !== userId) {
      return null;
    }

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
    const task = await prisma.task.findUnique({
      where: {
        id,
      },
    });

    if (!task || task.userId !== userId) {
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
    return prisma.task.findMany({
      where: {
        userId,
        completed: false,
        dueDate: {
          gte: new Date()
            .toISOString()
            .split("T")[0],
        },
      },

      include: {
        subTasks: true,
      },

      orderBy: [
        {
          dueDate: "asc",
        },
        {
          dueTime: "asc",
        },
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
    const task = await prisma.task.findUnique({
      where: {
        id,
      },
    });

    if (!task || task.userId !== userId) {
      return null;
    }

    return prisma.task.update({
      where: {
        id,
      },

      data: {
        dueDate: data.dueDate,

        ...(data.dueTime !== undefined && {
          dueTime: data.dueTime,
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
    const subTask =
      await prisma.subTask.findFirst({
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

export const taskRepository =
  new TaskRepository();