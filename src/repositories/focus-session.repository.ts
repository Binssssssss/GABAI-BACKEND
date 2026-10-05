import { prisma } from "../lib/prisma";

class FocusSessionRepository {
  async getActiveSession(userId: string) {
    return prisma.focusSession.findFirst({
      where: {
        userId,
        status: {
          in: ["RUNNING", "PAUSED"],
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  async getSessionById(sessionId: string, userId: string) {
    return prisma.focusSession.findFirst({
      where: {
        id: sessionId,
        userId,
      },
    });
  }

  async createSession(
    userId: string,
    duration: number,
    targetHours: number,
    ambientSound = "NONE",
    isStrict = false,
    subject?: string,
    focusMode?: string
  ) {
    return prisma.focusSession.create({
      data: {
        userId,
        duration,
        remainingTime: duration,
        targetHours,
        status: "RUNNING",
        ambientSound,
        isStrict,
        subject: subject || null,
        focusMode: focusMode || null,
        startedAt: new Date(),
      },
    });
  }

  async updateSession(
    sessionId: string,
    userId: string,
    data: {
      remainingTime?: number;
      status?: string;
      ambientSound?: string;
      isStrict?: boolean;
      subject?: string | null;
      focusMode?: string | null;
      endedAt?: Date | null;
    }
  ) {
    return prisma.focusSession.updateMany({
      where: {
        id: sessionId,
        userId,
      },
      data,
    });
  }

  async getCompletedSessionsInRange(
    userId: string,
    startDate: Date,
    endDate: Date
  ) {
    return prisma.focusSession.findMany({
      where: {
        userId,
        status: "COMPLETED",
        endedAt: {
          gte: startDate,
          lt: endDate,
        },
      },
      orderBy: {
        endedAt: "desc",
      },
    });
  }

  async getAllCompletedSessions(userId: string) {
    return prisma.focusSession.findMany({
      where: {
        userId,
        status: "COMPLETED",
      },
      orderBy: {
        endedAt: "desc",
      },
    });
  }

  /**
   * Get completed focus sessions for history.
   */
  async getCompletedSessionHistory(
    userId: string,
    limit = 50,
    offset = 0
  ) {
    return prisma.focusSession.findMany({
      where: {
        userId,
        status: "COMPLETED",
      },
      orderBy: {
        endedAt: "desc",
      },
      take: limit,
      skip: offset,
    });
  }

  async getCompletedSessionEndDates(userId: string) {
    return prisma.focusSession.findMany({
      where: {
        userId,
        status: "COMPLETED",
        endedAt: {
          not: null,
        },
      },
      select: {
        endedAt: true,
      },
      orderBy: {
        endedAt: "desc",
      },
    });
  }
}

export const focusSessionRepository = new FocusSessionRepository();