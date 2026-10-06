import {
  CreateNotificationInput,
  NotificationResponse,
} from "@/types/notification.types";

import { notificationRepository } from "@/repositories/notification.repository";

export const getNotificationsByUser = async (
  userId: string
): Promise<NotificationResponse[]> => {
  const notifications =
    await notificationRepository.getUserNotifications(userId);

  return notifications.map((notification) => ({
    id: notification.id,
    title: notification.title,
    message: notification.message,
    type: notification.type as NotificationResponse["type"],
    time: notification.time,
    read: notification.read,
    icon: notification.icon,
    iconColor: notification.iconColor,
    taskId: notification.taskId ?? undefined,
    assignmentId: notification.assignmentId ?? undefined,
    createdAt: notification.createdAt,
  }));
};

export const getNotificationById = async (
  userId: string,
  notificationId: string
) => {
  return notificationRepository.getNotificationById(
    notificationId,
    userId
  );
};

export const createNotification = async (
  userId: string,
  data: CreateNotificationInput
) => {
  return notificationRepository.createNotification(
    userId,
    data
  );
};

export const markNotificationAsRead = async (
  userId: string,
  notificationId: string
) => {
  return notificationRepository.markAsRead(
    notificationId,
    userId
  );
};

export const markAllNotificationsAsRead = async (
  userId: string
) => {
  return notificationRepository.markAllAsRead(userId);
};

export const deleteNotification = async (
  userId: string,
  notificationId: string
) => {
  return notificationRepository.deleteNotification(
    notificationId,
    userId
  );
};
