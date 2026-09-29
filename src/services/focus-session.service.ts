import {
  focusSessionRepository,
} from "../repositories/focus-session.repository";

import {
  StartFocusSessionInput,
  FocusSessionResponse,
} from "@/types/focus-session.types";

export const focusSessionService = {
  async getCurrentSession(
    userId: string,
  ): Promise<FocusSessionResponse | null> {
    const session =
      await focusSessionRepository.getActiveSession(
        userId,
      );

    if (!session) {
      return null;
    }

    return toFocusSessionResponse(session);
  },

  async startSession(
    userId: string,
    input: StartFocusSessionInput,
  ): Promise<FocusSessionResponse> {
    const existingSession =
      await focusSessionRepository.getActiveSession(
        userId,
      );

    if (existingSession) {
      return toFocusSessionResponse(existingSession);
    }

    const duration = input.duration ?? 25 * 60;
    const targetHours = input.targetHours ?? 1.5;

    if (duration <= 0) {
      throw new Error(
        "Focus session duration must be greater than zero.",
      );
    }

    if (targetHours <= 0) {
      throw new Error(
        "Target hours must be greater than zero.",
      );
    }

    const session =
      await focusSessionRepository.createSession(
        userId,
        duration,
        targetHours,
      );

    return toFocusSessionResponse(session);
  },

  async pauseSession(
    userId: string,
    sessionId: string,
    remainingTime: number,
  ) {
    const session =
      await focusSessionRepository.getSessionById(
        sessionId,
        userId,
      );

    if (!session) {
      throw new Error("Focus session not found.");
    }

    if (remainingTime < 0) {
      throw new Error(
        "Remaining time cannot be negative.",
      );
    }

    await focusSessionRepository.updateSession(
      sessionId,
      userId,
      {
        remainingTime,
        status: "PAUSED",
      },
    );

    return focusSessionRepository.getSessionById(
      sessionId,
      userId,
    );
  },

  async resumeSession(
    userId: string,
    sessionId: string,
  ) {
    const session =
      await focusSessionRepository.getSessionById(
        sessionId,
        userId,
      );

    if (!session) {
      throw new Error("Focus session not found.");
    }

    await focusSessionRepository.updateSession(
      sessionId,
      userId,
      {
        status: "RUNNING",
      },
    );

    return focusSessionRepository.getSessionById(
      sessionId,
      userId,
    );
  },

  async completeSession(
    userId: string,
    sessionId: string,
  ) {
    const session =
      await focusSessionRepository.getSessionById(
        sessionId,
        userId,
      );

    if (!session) {
      throw new Error("Focus session not found.");
    }

    await focusSessionRepository.updateSession(
      sessionId,
      userId,
      {
        remainingTime: 0,
        status: "COMPLETED",
        endedAt: new Date(),
      },
    );

    return focusSessionRepository.getSessionById(
      sessionId,
      userId,
    );
  },

  async cancelSession(
    userId: string,
    sessionId: string,
  ) {
    const session =
      await focusSessionRepository.getSessionById(
        sessionId,
        userId,
      );

    if (!session) {
      throw new Error("Focus session not found.");
    }

    await focusSessionRepository.updateSession(
      sessionId,
      userId,
      {
        status: "CANCELLED",
        endedAt: new Date(),
      },
    );

    return focusSessionRepository.getSessionById(
      sessionId,
      userId,
    );
  },
};

function toFocusSessionResponse(session: {
  id: string;
  duration: number;
  remainingTime: number;
  targetHours: number;
  status: string;
  startedAt: Date | null;
  endedAt: Date | null;
  createdAt: Date;
}): FocusSessionResponse {
  const statuses = [
    "IDLE",
    "RUNNING",
    "PAUSED",
    "COMPLETED",
    "CANCELLED",
  ] as const;

  if (!statuses.includes(session.status as (typeof statuses)[number])) {
    throw new Error(`Invalid focus session status: ${session.status}`);
  }

  return {
    id: session.id,
    duration: session.duration,
    remainingTime: session.remainingTime,
    targetHours: session.targetHours,
    status: session.status as FocusSessionResponse["status"],
    startedAt: session.startedAt,
    endedAt: session.endedAt,
    createdAt: session.createdAt,
  };
}