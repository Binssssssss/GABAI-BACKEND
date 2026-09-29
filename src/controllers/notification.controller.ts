import {
  NextFunction,
  Request,
  Response,
} from "express";

import {
  notificationService,
} from "@/services/notification.service";

import {
  sendError,
  sendSuccess,
} from "@/utils/response";

export class NotificationController {
  async getNotifications(
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

      const notifications =
        await notificationService.getNotifications(
          String(userId),
        );

      return sendSuccess(
        res,
        "Notifications retrieved successfully.",
        notifications,
      );
    } catch (error) {
      next(error);
    }
  }

  async createNotification(
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
        title,
        message,
        type,
        time,
        icon,
        iconColor,
        taskId,
        assignmentId,
      } = req.body;

      if (
        !title ||
        !message ||
        !type ||
        !time ||
        !icon ||
        !iconColor
      ) {
        return sendError(
          res,
          "title, message, type, time, icon, and iconColor are required.",
          400,
        );
      }

      const notification =
        await notificationService.createNotification(
          String(userId),
          {
            title,
            message,
            type,
            time,
            icon,
            iconColor,
            taskId,
            assignmentId,
          },
        );

      return sendSuccess(
        res,
        "Notification created successfully.",
        notification,
      );
    } catch (error) {
      next(error);
    }
  }

  async markAsRead(
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

      if (!id) {
        return sendError(
          res,
          "Notification ID is required.",
          400,
        );
      }

      await notificationService.markAsRead(
        String(id),
        String(userId),
      );

      return sendSuccess(
        res,
        "Notification marked as read.",
        null,
      );
    } catch (error) {
      next(error);
    }
  }

  async markAllAsRead(
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

      await notificationService.markAllAsRead(
        String(userId),
      );

      return sendSuccess(
        res,
        "All notifications marked as read.",
        null,
      );
    } catch (error) {
      next(error);
    }
  }

  async deleteNotification(
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

      if (!id) {
        return sendError(
          res,
          "Notification ID is required.",
          400,
        );
      }

      await notificationService.deleteNotification(
        String(id),
        String(userId),
      );

      return sendSuccess(
        res,
        "Notification deleted successfully.",
        null,
      );
    } catch (error) {
      next(error);
    }
  }
}

export const notificationController =
  new NotificationController();