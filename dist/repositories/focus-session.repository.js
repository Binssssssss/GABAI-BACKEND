import { prisma } from "../lib/prisma";
export const focusSessionRepository = {
    async getActiveSession(userId) {
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
    async getSessionById(sessionId, userId) {
        return prisma.focusSession.findFirst({
            where: {
                id: sessionId,
                userId,
            },
        });
    },
    async createSession(userId, duration, targetHours) {
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
    async updateSession(sessionId, userId, data) {
        return prisma.focusSession.updateMany({
            where: {
                id: sessionId,
                userId,
            },
            data,
        });
    },
};
//# sourceMappingURL=focus-session.repository.js.map