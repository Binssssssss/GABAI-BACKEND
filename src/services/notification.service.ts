import { prisma } from "@/lib/prisma";

export interface CreateNotificationInput {
  title: string;
  message: string;
  type: string;
  time: string;
  icon: string;
  iconColor: string;
  taskId?: string;
  assignmentId?: string;
}

export const getNotificationsByUser = async (
  userId: string
) => {
  return prisma.notifications.findMany({
    where: {
      userId,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
};

export const getNotificationById = async (
  userId: string,
  notificationId: string
) => {
  return prisma.notifications.findFirst({
    where: {
      id: notificationId,
      userId,
    },
  });
};

export const createNotification = async (
  userId: string,
  data: CreateNotificationInput
) => {
  return prisma.notifications.create({
    data: {
      id: crypto.randomUUID(),
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
};

export const markNotificationAsRead = async (
  userId: string,
  notificationId: string
) => {
  return prisma.notifications.updateMany({
    where: {
      id: notificationId,
      userId,
    },
    data: {
      read: true,
    },
  });
};

export const markAllNotificationsAsRead = async (
  userId: string
) => {
  return prisma.notifications.updateMany({
    where: {
      userId,
      read: false,
    },
    data: {
      read: true,
    },
  });
};

export const deleteNotification = async (
  userId: string,
  notificationId: string
) => {
  return prisma.notifications.deleteMany({
    where: {
      id: notificationId,
      userId,
    },
  });
};