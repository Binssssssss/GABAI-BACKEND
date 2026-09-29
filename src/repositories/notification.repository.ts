import { prisma } from "@/lib/prisma";

export const notificationRepository = {
  async getUserNotifications(userId: string) {
    return prisma.notification.findMany({
      where: {
        userId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  },

  async createNotification(
    userId: string,
    data: {
      title: string;
      message: string;
      type: string;
      time: string;
      icon: string;
      iconColor: string;
      taskId?: string;
      assignmentId?: string;
    },
  ) {
    return prisma.notification.create({
      data: {
        userId,
        title: data.title,
        message: data.message,
        type: data.type,
        time: data.time,
        icon: data.icon,
        iconColor: data.iconColor,
        taskId: data.taskId,
        assignmentId: data.assignmentId,
      },
    });
  },

  async markAsRead(
    notificationId: string,
    userId: string,
  ) {
    return prisma.notification.updateMany({
      where: {
        id: notificationId,
        userId,
      },
      data: {
        read: true,
      },
    });
  },

  async markAllAsRead(userId: string) {
    return prisma.notification.updateMany({
      where: {
        userId,
        read: false,
      },
      data: {
        read: true,
      },
    });
  },

  async deleteNotification(
    notificationId: string,
    userId: string,
  ) {
    return prisma.notification.deleteMany({
      where: {
        id: notificationId,
        userId,
      },
    });
  },
};