import { prisma } from "@/lib/prisma";

export const subjectProgressRepository = {
  async getSubjectProgress(userId: string) {
    const tasks = await prisma.task.findMany({
      where: {
        userId,
      },
      select: {
        subject: true,
        completed: true,
      },
    });

    return tasks;
  },
};