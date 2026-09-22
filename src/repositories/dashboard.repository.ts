import { prisma } from "@/lib/prisma";

export const dashboardRepository = {
  async getTaskStats(userId: string) {
    const [tasksCount, deadlinesCount] = await Promise.all([
      prisma.task.count({
        where: {
          userId,
          completed: false,
        },
      }),

      prisma.task.count({
        where: {
          userId,
          completed: false,
          dueDate: {
            not: "",
          },
        },
      }),
    ]);

    return {
      tasksCount,
      deadlinesCount,
    };
  },
};