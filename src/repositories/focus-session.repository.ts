import { prisma } from "../lib/prisma";

export const focusSessionRepository = {
  async getActiveSession(userId: string) {
    return prisma.focusSession.findFirst({
      where: {
        userId,
        status: {
          in: ["IDLE", "RUNNING", "PAUSED"],
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  },

  async getSessionById(sessionId: string, userId: string) {
    return prisma.focusSession.findFirst({
      where: {
        id: sessionId,
        userId,
      },
    });
  },

  async createSession(
    userId: string,
    duration: number,
    targetHours: number,
  ) {
    return prisma.focusSession.create({
      data: {
        userId,
        duration,
        remainingTime: duration,
        targetHours,
        status: "RUNNING",
        startedAt: new Date(),
      },
    });
  },

  async updateSession(
    sessionId: string,
    userId: string,
    data: {
      remainingTime?: number;
      status?: string;
      endedAt?: Date;
    },
  ) {
    return prisma.focusSession.updateMany({
      where: {
        id: sessionId,
        userId,
      },
      data,
    });
  },
};
