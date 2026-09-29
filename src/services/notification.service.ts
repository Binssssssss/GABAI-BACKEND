import {
  CreateNotificationInput,
  NotificationResponse,
} from "@/types/notification.types";

import {
  notificationRepository,
} from "@/repositories/notification.repository";

export const notificationService = {
  async getNotifications(
    userId: string,
  ): Promise<NotificationResponse[]> {
    const notifications =
      await notificationRepository.getUserNotifications(
        userId,
      );

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
      assignmentId:
        notification.assignmentId ?? undefined,
      createdAt: notification.createdAt,
    }));
  },

  async createNotification(
    userId: string,
    data: CreateNotificationInput,
  ) {
    return notificationRepository.createNotification(
      userId,
      data,
    );
  },

  async markAsRead(
    notificationId: string,
    userId: string,
  ) {
    return notificationRepository.markAsRead(
      notificationId,
      userId,
    );
  },

  async markAllAsRead(userId: string) {
    return notificationRepository.markAllAsRead(
      userId,
    );
  },

  async deleteNotification(
    notificationId: string,
    userId: string,
  ) {
    return notificationRepository.deleteNotification(
      notificationId,
      userId,
    );
  },
};