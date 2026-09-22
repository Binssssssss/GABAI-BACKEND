import {
  NextFunction,
  Request,
  Response,
} from "express";

import {
  focusSessionService,
} from "@/services/focus-session.service";

import {
  sendError,
  sendSuccess,
} from "@/utils/response";

export class FocusSessionController {
  async getCurrentSession(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return sendError(
          res,
          "Authentication required. Please log in.",
          401,
        );
      }

      const session =
        await focusSessionService.getCurrentSession(
          String(userId),
        );

      return sendSuccess(
        res,
        "Focus session retrieved successfully.",
        session,
      );
    } catch (error) {
      next(error);
    }
  }

  async startSession(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return sendError(
          res,
          "Authentication required. Please log in.",
          401,
        );
      }

      const {
        duration,
        targetHours,
      } = req.body;

      const session =
        await focusSessionService.startSession(
          String(userId),
          {
            duration,
            targetHours,
          },
        );

      return sendSuccess(
        res,
        "Focus session started successfully.",
        session,
      );
    } catch (error) {
      next(error);
    }
  }

  async pauseSession(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const userId = req.user?.id;
      const { id } = req.params;
      const { remainingTime } = req.body;

      if (!userId) {
        return sendError(
          res,
          "Authentication required. Please log in.",
          401,
        );
      }

      if (!id) {
        return sendError(
          res,
          "Focus session ID is required.",
          400,
        );
      }

      if (
        typeof remainingTime !== "number"
      ) {
        return sendError(
          res,
          "Remaining time must be a number.",
          400,
        );
      }

      const session =
        await focusSessionService.pauseSession(
          String(userId),
          String(id),
          remainingTime,
        );

      return sendSuccess(
        res,
        "Focus session paused.",
        session,
      );
    } catch (error) {
      next(error);
    }
  }

  async resumeSession(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const userId = req.user?.id;
      const { id } = req.params;

      if (!userId) {
        return sendError(
          res,
          "Authentication required. Please log in.",
          401,
        );
      }

      const session =
        await focusSessionService.resumeSession(
          String(userId),
          String(id),
        );

      return sendSuccess(
        res,
        "Focus session resumed.",
        session,
      );
    } catch (error) {
      next(error);
    }
  }

  async completeSession(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const userId = req.user?.id;
      const { id } = req.params;

      if (!userId) {
        return sendError(
          res,
          "Authentication required. Please log in.",
          401,
        );
      }

      const session =
        await focusSessionService.completeSession(
          String(userId),
          String(id),
        );

      return sendSuccess(
        res,
        "Focus session completed.",
        session,
      );
    } catch (error) {
      next(error);
    }
  }

  async cancelSession(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const userId = req.user?.id;
      const { id } = req.params;

      if (!userId) {
        return sendError(
          res,
          "Authentication required. Please log in.",
          401,
        );
      }

      const session =
        await focusSessionService.cancelSession(
          String(userId),
          String(id),
        );

      return sendSuccess(
        res,
        "Focus session cancelled.",
        session,
      );
    } catch (error) {
      next(error);
    }
  }
}

export const focusSessionController =
  new FocusSessionController();