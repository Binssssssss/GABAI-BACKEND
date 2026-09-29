import { prisma } from "@/lib/prisma";

export const smartReminderRepository = {
  async getUserTasks(userId: string) {
    return prisma.task.findMany({
      where: {
        userId,
        completed: false,
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        title: true,
        subject: true,
        priority: true,
        dueDate: true,
        dueTime: true,
        completed: true,
      },
    });
  },
};