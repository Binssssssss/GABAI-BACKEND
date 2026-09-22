import { focusSessionRepository, } from "../repositories/focus-session.repository";
export const focusSessionService = {
    async getCurrentSession(userId) {
        const session = await focusSessionRepository.getActiveSession(userId);
        if (!session) {
            return null;
        }
        return toFocusSessionResponse(session);
    },
    async startSession(userId, input) {
        const existingSession = await focusSessionRepository.getActiveSession(userId);
        if (existingSession) {
            return toFocusSessionResponse(existingSession);
        }
        const duration = input.duration ?? 25 * 60;
        const targetHours = input.targetHours ?? 1.5;
        if (duration <= 0) {
            throw new Error("Focus session duration must be greater than zero.");
        }
        if (targetHours <= 0) {
            throw new Error("Target hours must be greater than zero.");
        }
        const session = await focusSessionRepository.createSession(userId, duration, targetHours);
        return toFocusSessionResponse(session);
    },
    async pauseSession(userId, sessionId, remainingTime) {
        const session = await focusSessionRepository.getSessionById(sessionId, userId);
        if (!session) {
            throw new Error("Focus session not found.");
        }
        if (remainingTime < 0) {
            throw new Error("Remaining time cannot be negative.");
        }
        await focusSessionRepository.updateSession(sessionId, userId, {
            remainingTime,
            status: "PAUSED",
        });
        return focusSessionRepository.getSessionById(sessionId, userId);
    },
    async resumeSession(userId, sessionId) {
        const session = await focusSessionRepository.getSessionById(sessionId, userId);
        if (!session) {
            throw new Error("Focus session not found.");
        }
        await focusSessionRepository.updateSession(sessionId, userId, {
            status: "RUNNING",
        });
        return focusSessionRepository.getSessionById(sessionId, userId);
    },
    async completeSession(userId, sessionId) {
        const session = await focusSessionRepository.getSessionById(sessionId, userId);
        if (!session) {
            throw new Error("Focus session not found.");
        }
        await focusSessionRepository.updateSession(sessionId, userId, {
            remainingTime: 0,
            status: "COMPLETED",
            endedAt: new Date(),
        });
        return focusSessionRepository.getSessionById(sessionId, userId);
    },
    async cancelSession(userId, sessionId) {
        const session = await focusSessionRepository.getSessionById(sessionId, userId);
        if (!session) {
            throw new Error("Focus session not found.");
        }
        await focusSessionRepository.updateSession(sessionId, userId, {
            status: "CANCELLED",
            endedAt: new Date(),
        });
        return focusSessionRepository.getSessionById(sessionId, userId);
    },
};
function toFocusSessionResponse(session) {
    const statuses = [
        "IDLE",
        "RUNNING",
        "PAUSED",
        "COMPLETED",
        "CANCELLED",
    ];
    if (!statuses.includes(session.status)) {
        throw new Error(`Invalid focus session status: ${session.status}`);
    }
    return {
        id: session.id,
        duration: session.duration,
        remainingTime: session.remainingTime,
        targetHours: session.targetHours,
        status: session.status,
        startedAt: session.startedAt,
        endedAt: session.endedAt,
        createdAt: session.createdAt,
    };
}
//# sourceMappingURL=focus-session.service.js.map