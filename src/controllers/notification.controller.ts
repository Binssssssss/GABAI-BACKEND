
import { Request, Response } from "express";
import * as notificationService from "@/services/notification.service";

type NotificationIdParams = {
  id: string;
};

export const getNotifications = async (
  req: Request,
  res: Response
) => {
  try {
    const userId = req.user.id;

    const notifications =
      await notificationService.getNotificationsByUser(
        userId
      );

    return res.status(200).json({
      success: true,
      data: notifications,
    });
  } catch (error) {
    console.error(
      "Failed to get notifications:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to fetch notifications.",
    });
  }
};

export const getNotificationById = async (
  req: Request<NotificationIdParams>,
  res: Response
) => {
  try {
    const userId = req.user.id;
    const id = req.params.id;

    const notification =
      await notificationService.getNotificationById(
        userId,
        id
      );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found.",
      });
    }

    return res.status(200).json({
      success: true,
      data: notification,
    });
  } catch (error) {
    console.error(
      "Failed to get notification:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to fetch notification.",
    });
  }
};

export const createNotification = async (
  req: Request,
  res: Response
) => {
  try {
    const userId = req.user.id;

    const notification =
      await notificationService.createNotification(
        userId,
        req.body
      );

    return res.status(201).json({
      success: true,
      data: notification,
    });
  } catch (error) {
    console.error(
      "Failed to create notification:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to create notification.",
    });
  }
};

export const markNotificationAsRead = async (
  req: Request<NotificationIdParams>,
  res: Response
) => {
  try {
    const userId = req.user.id;
    const id = req.params.id;

    const result =
      await notificationService.markNotificationAsRead(
        userId,
        id
      );

    if (result.count === 0) {
      return res.status(404).json({
        success: false,
        message: "Notification not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Notification marked as read.",
    });
  } catch (error) {
    console.error(
      "Failed to mark notification as read:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to mark notification as read.",
    });
  }
};

export const markAllNotificationsAsRead = async (
  req: Request,
  res: Response
) => {
  try {
    const userId = req.user.id;

    await notificationService.markAllNotificationsAsRead(
      userId
    );

    return res.status(200).json({
      success: true,
      message: "All notifications marked as read.",
    });
  } catch (error) {
    console.error(
      "Failed to mark all notifications as read:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to mark all notifications as read.",
    });
  }
};

export const deleteNotification = async (
  req: Request<NotificationIdParams>,
  res: Response
) => {
  try {
    const userId = req.user.id;
    const id = req.params.id;

    const result =
      await notificationService.deleteNotification(
        userId,
        id
      );

    if (result.count === 0) {
      return res.status(404).json({
        success: false,
        message: "Notification not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Notification deleted.",
    });
  } catch (error) {
    console.error(
      "Failed to delete notification:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to delete notification.",
    });
  }
};
export const registerPushToken = async (
  req: Request,
  res: Response
) => {
  try {
    const userId = req.user.id;

    const { token, platform } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: "Push token is required.",
      });
    }

    const pushToken =
      await notificationService.registerPushToken(
        userId,
        token,
        platform || "android"
      );

    return res.status(200).json({
      success: true,
      message: "Push token registered successfully.",
      data: pushToken,
    });
  } catch (error) {
    console.error(
      "Failed to register push token:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to register push token.",
    });
  }
};
