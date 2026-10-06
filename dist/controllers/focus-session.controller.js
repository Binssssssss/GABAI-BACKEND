import { focusSessionService } from "../services/focus-session.service.js";
import { sendError, sendSuccess } from "../utils/response.js";
class FocusSessionController {
    /**
     * GET /api/focus-sessions/current
     */
    async getCurrentSession(req, res) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                return sendError(res, "Unauthorized", 401);
            }
            const session = await focusSessionService.getCurrentSession(userId);
            return sendSuccess(res, "Current focus session retrieved successfully.", session);
        }
        catch (error) {
            console.error("Get current focus session error:", error);
            return sendError(res, error instanceof Error
                ? error.message
                : "Failed to retrieve current focus session.", 500);
        }
    }
    /**
     * GET /api/focus-sessions/stats
     */
    async getFocusStats(req, res) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                return sendError(res, "Unauthorized", 401);
            }
            const stats = await focusSessionService.getFocusStats(userId);
            return sendSuccess(res, "Focus statistics retrieved successfully.", stats);
        }
        catch (error) {
            console.error("Get focus stats error:", error);
            return sendError(res, error instanceof Error
                ? error.message
                : "Failed to retrieve focus statistics.", 500);
        }
    }
    /**
     * GET /api/focus-sessions/history
     */
    async getSessionHistory(req, res) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                return sendError(res, "Unauthorized", 401);
            }
            const limitParam = Number(req.query.limit);
            const offsetParam = Number(req.query.offset);
            const limit = Number.isFinite(limitParam) &&
                limitParam > 0
                ? Math.min(Math.floor(limitParam), 100)
                : 50;
            const offset = Number.isFinite(offsetParam) &&
                offsetParam >= 0
                ? Math.floor(offsetParam)
                : 0;
            const history = await focusSessionService.getSessionHistory(userId, limit, offset);
            return sendSuccess(res, "Focus session history retrieved successfully.", history);
        }
        catch (error) {
            console.error("Get focus session history error:", error);
            return sendError(res, error instanceof Error
                ? error.message
                : "Failed to retrieve focus session history.", 500);
        }
    }
    /**
     * POST /api/focus-sessions/start
     */
    async startSession(req, res) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                return sendError(res, "Unauthorized", 401);
            }
            const { duration, targetHours, ambientSound, isStrict, subject, focusMode, } = req.body;
            const session = await focusSessionService.startSession(userId, {
                duration,
                targetHours,
                ambientSound,
                isStrict,
                subject,
                focusMode,
            });
            return sendSuccess(res, "Focus session started successfully.", session, 201);
        }
        catch (error) {
            console.error("Start focus session error:", error);
            return sendError(res, error instanceof Error
                ? error.message
                : "Failed to start focus session.", 400);
        }
    }
    /**
     * PATCH /api/focus-sessions/:id
     */
    async updateAmbientSound(req, res) {
        try {
            const userId = req.user?.id;
            const id = getParamString(req.params.id);
            const { ambientSound } = req.body;
            if (!userId) {
                return sendError(res, "Unauthorized", 401);
            }
            if (!id) {
                return sendError(res, "Focus session ID is required.", 400);
            }
            if (!ambientSound) {
                return sendError(res, "Ambient sound is required.", 400);
            }
            const session = await focusSessionService.updateAmbientSound(userId, id, ambientSound);
            return sendSuccess(res, "Ambient sound updated successfully.", session);
        }
        catch (error) {
            console.error("Update ambient sound error:", error);
            return sendError(res, error instanceof Error
                ? error.message
                : "Failed to update ambient sound.", 400);
        }
    }
    /**
     * PATCH /api/focus-sessions/:id/strict
     */
    async updateStrictMode(req, res) {
        try {
            const userId = req.user?.id;
            const id = getParamString(req.params.id);
            const { isStrict } = req.body;
            if (!userId) {
                return sendError(res, "Unauthorized", 401);
            }
            if (!id) {
                return sendError(res, "Focus session ID is required.", 400);
            }
            if (typeof isStrict !== "boolean") {
                return sendError(res, "isStrict must be a boolean value.", 400);
            }
            const session = await focusSessionService.updateStrictMode(userId, id, isStrict);
            return sendSuccess(res, "Strict mode updated successfully.", session);
        }
        catch (error) {
            console.error("Update strict mode error:", error);
            return sendError(res, error instanceof Error
                ? error.message
                : "Failed to update strict mode.", 400);
        }
    }
    /**
     * PATCH /api/focus-sessions/:id/pause
     */
    async pauseSession(req, res) {
        try {
            const userId = req.user?.id;
            const id = getParamString(req.params.id);
            const { remainingTime } = req.body;
            if (!userId) {
                return sendError(res, "Unauthorized", 401);
            }
            if (!id) {
                return sendError(res, "Focus session ID is required.", 400);
            }
            const session = await focusSessionService.pauseSession(userId, id, remainingTime);
            return sendSuccess(res, "Focus session paused successfully.", session);
        }
        catch (error) {
            console.error("Pause focus session error:", error);
            return sendError(res, error instanceof Error
                ? error.message
                : "Failed to pause focus session.", 400);
        }
    }
    /**
     * PATCH /api/focus-sessions/:id/resume
     */
    async resumeSession(req, res) {
        try {
            const userId = req.user?.id;
            const id = getParamString(req.params.id);
            if (!userId) {
                return sendError(res, "Unauthorized", 401);
            }
            if (!id) {
                return sendError(res, "Focus session ID is required.", 400);
            }
            const session = await focusSessionService.resumeSession(userId, id);
            return sendSuccess(res, "Focus session resumed successfully.", session);
        }
        catch (error) {
            console.error("Resume focus session error:", error);
            return sendError(res, error instanceof Error
                ? error.message
                : "Failed to resume focus session.", 400);
        }
    }
    /**
     * PATCH /api/focus-sessions/:id/complete
     */
    async completeSession(req, res) {
        try {
            const userId = req.user?.id;
            const id = getParamString(req.params.id);
            if (!userId) {
                return sendError(res, "Unauthorized", 401);
            }
            if (!id) {
                return sendError(res, "Focus session ID is required.", 400);
            }
            const session = await focusSessionService.completeSession(userId, id);
            return sendSuccess(res, "Focus session completed successfully.", session);
        }
        catch (error) {
            console.error("Complete focus session error:", error);
            return sendError(res, error instanceof Error
                ? error.message
                : "Failed to complete focus session.", 400);
        }
    }
    /**
     * PATCH /api/focus-sessions/:id/cancel
     */
    async cancelSession(req, res) {
        try {
            const userId = req.user?.id;
            const id = getParamString(req.params.id);
            if (!userId) {
                return sendError(res, "Unauthorized", 401);
            }
            if (!id) {
                return sendError(res, "Focus session ID is required.", 400);
            }
            const session = await focusSessionService.cancelSession(userId, id);
            return sendSuccess(res, "Focus session cancelled successfully.", session);
        }
        catch (error) {
            console.error("Cancel focus session error:", error);
            return sendError(res, error instanceof Error
                ? error.message
                : "Failed to cancel focus session.", 400);
        }
    }
}
function getParamString(value) {
    if (Array.isArray(value)) {
        return value[0];
    }
    return value;
}
export const focusSessionController = new FocusSessionController();
//# sourceMappingURL=focus-session.controller.js.map