import { prisma } from "../lib/prisma.js";
class FocusSessionRepository {
    async getActiveSession(userId) {
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
    async getSessionById(sessionId, userId) {
        return prisma.focusSession.findFirst({
            where: {
                id: sessionId,
                userId,
            },
        });
    }
    async createSession(userId, duration, targetHours, ambientSound = "NONE", isStrict = false, subject, focusMode) {
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
    async updateSession(sessionId, userId, data) {
        return prisma.focusSession.updateMany({
            where: {
                id: sessionId,
                userId,
            },
            data,
        });
    }
    async getCompletedSessionsInRange(userId, startDate, endDate) {
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
    async getAllCompletedSessions(userId) {
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
    async getCompletedSessionHistory(userId, limit = 50, offset = 0) {
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
    async getCompletedSessionEndDates(userId) {
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
//# sourceMappingURL=focus-session.repository.js.map