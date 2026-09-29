import { prisma } from '../lib/prisma';

export class AssistantRepository {
  async getUserContext(userId: string) {
    const [tasks, subjects, recentActivities, focusSessions] =
      await Promise.all([
        prisma.task.findMany({
          where: {
            userId,
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 20,
        }),

        prisma.subjects.findMany({
          where: {
            userId,
          },
          orderBy: {
            name: 'asc',
          },
        }),

        prisma.recentActivity.findMany({
          where: {
            userId,
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 10,
        }),

        prisma.focusSession.findMany({
          where: {
            userId,
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 10,
        }),
      ]);

    return {
      tasks,
      subjects,
      recentActivities,
      focusSessions,
    };
  }
}

export const assistantRepository = new AssistantRepository();