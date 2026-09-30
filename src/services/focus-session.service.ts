import { focusSessionRepository } from "../repositories/focus-session.repository";
import {
  AmbientSound,
  FocusMode,
  FocusSessionRecord,
  FocusSessionResponse,
  FocusStats,
  StartFocusSessionInput,
} from "../types/focus-session.types";

const MANILA_TIME_ZONE = "Asia/Manila";

class FocusSessionService {
  /**
   * Get the user's currently active focus session.
   */
  async getCurrentSession(
    userId: string
  ): Promise<FocusSessionResponse | null> {
    const session =
      await focusSessionRepository.getActiveSession(userId);

    if (!session) {
      return null;
    }

    return this.toFocusSessionResponse(session);
  }

  /**
   * Get focus statistics.
   */
  async getFocusStats(userId: string): Promise<FocusStats> {
    const { start, end } = this.getTodayRange();

    const todaySessions =
      await focusSessionRepository.getCompletedSessionsInRange(
        userId,
        start,
        end
      );

    const allCompletedSessions =
      await focusSessionRepository.getAllCompletedSessions(userId);

    const todayMinutes = todaySessions.reduce(
      (total, session) => {
        return total + Math.round(session.duration / 60);
      },
      0
    );

    const todaySessionsCount = todaySessions.length;

    const totalMinutes = allCompletedSessions.reduce(
      (total, session) => {
        return total + Math.round(session.duration / 60);
      },
      0
    );

    const totalHours = Number(
      (totalMinutes / 60).toFixed(1)
    );

    const streakDays =
      this.calculateStreak(allCompletedSessions);

    return {
      todayMinutes,
      todaySessions: todaySessionsCount,
      streakDays,
      totalHours,
    };
  }

  /**
   * Get completed focus session history.
   */
  async getSessionHistory(
    userId: string,
    limit = 50,
    offset = 0
  ): Promise<FocusSessionRecord[]> {
    const sessions =
      await focusSessionRepository.getCompletedSessionHistory(
        userId,
        limit,
        offset
      );

    return sessions
      .filter((session) => session.endedAt !== null)
      .map((session) => {
        return {
          id: session.id,

          subject:
            session.subject?.trim() || "General Study",

          durationMinutes: Math.round(
            session.duration / 60
          ),

          mode: this.normalizeFocusMode(
            session.focusMode || "custom"
          ),

          completedAt:
            session.endedAt!.toISOString(),

          isStrict: session.isStrict,
        };
      });
  }

  /**
   * Start a new focus session.
   */
  async startSession(
    userId: string,
    input: StartFocusSessionInput
  ): Promise<FocusSessionResponse> {
    const activeSession =
      await focusSessionRepository.getActiveSession(userId);

    if (activeSession) {
      throw new Error(
        "You already have an active focus session."
      );
    }

    const duration =
      input.duration ?? 25 * 60;

    const targetHours =
      input.targetHours ?? 1.5;

    const ambientSound =
      this.normalizeAmbientSound(
        input.ambientSound ?? "none"
      );

    const isStrict =
      input.isStrict ?? false;

    const subject =
      input.subject?.trim() || null;

    const focusMode =
      this.normalizeFocusMode(
        input.focusMode ?? "pomodoro"
      );

    if (
      !Number.isInteger(duration) ||
      duration <= 0
    ) {
      throw new Error(
        "Duration must be a positive number of seconds."
      );
    }

    if (
      typeof targetHours !== "number" ||
      targetHours <= 0
    ) {
      throw new Error(
        "Target hours must be greater than zero."
      );
    }

    if (
      subject !== null &&
      subject.length > 200
    ) {
      throw new Error(
        "Subject must not exceed 200 characters."
      );
    }

    const session =
      await focusSessionRepository.createSession(
        userId,
        duration,
        targetHours,
        ambientSound,
        isStrict,
        subject ?? undefined,
        focusMode
      );

    const createdSession =
      await focusSessionRepository.getSessionById(
        session.id,
        userId
      );

    if (!createdSession) {
      throw new Error(
        "Failed to retrieve the newly created focus session."
      );
    }

    return this.toFocusSessionResponse(
      createdSession
    );
  }

  /**
   * Update ambient sound.
   */
  async updateAmbientSound(
    userId: string,
    sessionId: string,
    ambientSound: string
  ): Promise<FocusSessionResponse> {
    const session =
      await this.getOwnedSession(
        userId,
        sessionId
      );

    if (
      session.status !== "RUNNING" &&
      session.status !== "PAUSED"
    ) {
      throw new Error(
        "Ambient sound can only be changed for an active session."
      );
    }

    const normalized =
      this.normalizeAmbientSound(ambientSound);

    await focusSessionRepository.updateSession(
      sessionId,
      userId,
      {
        ambientSound: normalized,
      }
    );

    const updatedSession =
      await this.getOwnedSession(
        userId,
        sessionId
      );

    return this.toFocusSessionResponse(
      updatedSession
    );
  }

  /**
   * Enable or disable strict mode.
   */
  async updateStrictMode(
    userId: string,
    sessionId: string,
    isStrict: boolean
  ): Promise<FocusSessionResponse> {
    const session =
      await this.getOwnedSession(
        userId,
        sessionId
      );

    if (
      session.status !== "RUNNING" &&
      session.status !== "PAUSED"
    ) {
      throw new Error(
        "Strict mode can only be changed for an active session."
      );
    }

    if (typeof isStrict !== "boolean") {
      throw new Error(
        "isStrict must be a boolean value."
      );
    }

    await focusSessionRepository.updateSession(
      sessionId,
      userId,
      {
        isStrict,
      }
    );

    const updatedSession =
      await this.getOwnedSession(
        userId,
        sessionId
      );

    return this.toFocusSessionResponse(
      updatedSession
    );
  }

  /**
   * Pause a running session.
   */
  async pauseSession(
    userId: string,
    sessionId: string,
    remainingTime?: number
  ): Promise<FocusSessionResponse> {
    const session =
      await this.getOwnedSession(
        userId,
        sessionId
      );

    if (session.status !== "RUNNING") {
      throw new Error(
        "Only a running focus session can be paused."
      );
    }

    const newRemainingTime =
      remainingTime !== undefined
        ? remainingTime
        : session.remainingTime;

    if (
      !Number.isInteger(newRemainingTime) ||
      newRemainingTime < 0 ||
      newRemainingTime > session.duration
    ) {
      throw new Error(
        "Invalid remaining time."
      );
    }

    await focusSessionRepository.updateSession(
      sessionId,
      userId,
      {
        remainingTime: newRemainingTime,
        status: "PAUSED",
      }
    );

    const updatedSession =
      await this.getOwnedSession(
        userId,
        sessionId
      );

    return this.toFocusSessionResponse(
      updatedSession
    );
  }

  /**
   * Resume a paused session.
   */
  async resumeSession(
    userId: string,
    sessionId: string
  ): Promise<FocusSessionResponse> {
    const session =
      await this.getOwnedSession(
        userId,
        sessionId
      );

    if (session.status !== "PAUSED") {
      throw new Error(
        "Only a paused focus session can be resumed."
      );
    }

    await focusSessionRepository.updateSession(
      sessionId,
      userId,
      {
        status: "RUNNING",
      }
    );

    const updatedSession =
      await this.getOwnedSession(
        userId,
        sessionId
      );

    return this.toFocusSessionResponse(
      updatedSession
    );
  }

  /**
   * Complete a focus session.
   */
  async completeSession(
    userId: string,
    sessionId: string
  ): Promise<FocusSessionResponse> {
    const session =
      await this.getOwnedSession(
        userId,
        sessionId
      );

    if (
      session.status !== "RUNNING" &&
      session.status !== "PAUSED"
    ) {
      throw new Error(
        "Only an active focus session can be completed."
      );
    }

    await focusSessionRepository.updateSession(
      sessionId,
      userId,
      {
        remainingTime: 0,
        status: "COMPLETED",
        endedAt: new Date(),
      }
    );

    const updatedSession =
      await this.getOwnedSession(
        userId,
        sessionId
      );

    return this.toFocusSessionResponse(
      updatedSession
    );
  }

  /**
   * Cancel a focus session.
   */
  async cancelSession(
    userId: string,
    sessionId: string
  ): Promise<FocusSessionResponse> {
    const session =
      await this.getOwnedSession(
        userId,
        sessionId
      );

    if (
      session.status !== "RUNNING" &&
      session.status !== "PAUSED"
    ) {
      throw new Error(
        "Only an active focus session can be cancelled."
      );
    }

    await focusSessionRepository.updateSession(
      sessionId,
      userId,
      {
        status: "CANCELLED",
        endedAt: new Date(),
      }
    );

    const updatedSession =
      await this.getOwnedSession(
        userId,
        sessionId
      );

    return this.toFocusSessionResponse(
      updatedSession
    );
  }

  /**
   * Retrieve a session owned by the current user.
   */
  private async getOwnedSession(
    userId: string,
    sessionId: string
  ) {
    const session =
      await focusSessionRepository.getSessionById(
        sessionId,
        userId
      );

    if (!session) {
      throw new Error(
        "Focus session not found."
      );
    }

    return session;
  }

  /**
   * Convert Prisma FocusSession into API response.
   */
  private toFocusSessionResponse(
    session: any
  ): FocusSessionResponse {
    return {
      id: session.id,
      duration: session.duration,
      remainingTime: session.remainingTime,
      targetHours: session.targetHours,
      status: session.status,
      ambientSound:
        this.normalizeAmbientSound(
          session.ambientSound
        ),
      isStrict: session.isStrict,
      subject: session.subject ?? null,
      focusMode: session.focusMode ?? null,
      startedAt: session.startedAt ?? null,
      endedAt: session.endedAt ?? null,
      createdAt: session.createdAt,
    };
  }

  /**
   * Normalize frontend/backend ambient sound values.
   */
  private normalizeAmbientSound(
    value: string
  ): AmbientSound {
    const normalized =
      value.trim().toLowerCase();

    const mapping: Record<
      string,
      AmbientSound
    > = {
      none: "NONE",
      rain: "RAIN",
      library: "LIBRARY",
      cafe: "CAFE",
      waves: "WAVES",
      whitenoise: "WHITENOISE",

      // Backward compatibility
      forest: "LIBRARY",
      ocean: "WAVES",
      fireplace: "WHITENOISE",
    };

    const result =
      mapping[normalized];

    if (!result) {
      throw new Error(
        `Invalid ambient sound: ${value}`
      );
    }

    return result;
  }

  /**
   * Validate and normalize focus mode.
   */
  private normalizeFocusMode(
    value: string
  ): FocusMode {
    const normalized =
      value.trim();

    const validModes: FocusMode[] = [
      "pomodoro",
      "deepWork",
      "shortBreak",
      "longBreak",
      "custom",
    ];

    if (
      validModes.includes(
        normalized as FocusMode
      )
    ) {
      return normalized as FocusMode;
    }

    throw new Error(
      `Invalid focus mode: ${value}`
    );
  }

  /**
   * Get today's date range in Asia/Manila.
   */
  private getTodayRange() {
    const todayKey =
      new Date().toLocaleDateString(
        "en-CA",
        {
          timeZone: MANILA_TIME_ZONE,
        }
      );

    const start =
      new Date(
        `${todayKey}T00:00:00+08:00`
      );

    const end =
      new Date(
        `${todayKey}T23:59:59.999+08:00`
      );

    return {
      start,
      end,
    };
  }

  /**
   * Calculate consecutive completed-session days.
   */
  private calculateStreak(
    sessions: Array<{
      endedAt: Date | null;
    }>
  ): number {
    const completedDates =
      new Set<string>();

    for (const session of sessions) {
      if (!session.endedAt) {
        continue;
      }

      const dateKey =
        session.endedAt.toLocaleDateString(
          "en-CA",
          {
            timeZone: MANILA_TIME_ZONE,
          }
        );

      completedDates.add(dateKey);
    }

    if (completedDates.size === 0) {
      return 0;
    }

    const todayKey =
      new Date().toLocaleDateString(
        "en-CA",
        {
          timeZone: MANILA_TIME_ZONE,
        }
      );

    const yesterday = new Date();

    yesterday.setDate(
      yesterday.getDate() - 1
    );

    const yesterdayKey =
      yesterday.toLocaleDateString(
        "en-CA",
        {
          timeZone: MANILA_TIME_ZONE,
        }
      );

    let currentKey: string;

    if (completedDates.has(todayKey)) {
      currentKey = todayKey;
    } else if (
      completedDates.has(yesterdayKey)
    ) {
      currentKey = yesterdayKey;
    } else {
      return 0;
    }

    let streak = 0;

    while (
      completedDates.has(currentKey)
    ) {
      streak++;

      const currentDate =
        new Date(
          `${currentKey}T00:00:00+08:00`
        );

      currentDate.setDate(
        currentDate.getDate() - 1
      );

      currentKey =
        currentDate.toLocaleDateString(
          "en-CA",
          {
            timeZone: MANILA_TIME_ZONE,
          }
        );
    }

    return streak;
  }
}

export const focusSessionService =
  new FocusSessionService();