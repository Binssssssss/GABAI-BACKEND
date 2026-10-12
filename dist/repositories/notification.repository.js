import { prisma } from "../lib/prisma.js";
export const notificationRepository = {
    async getUserNotifications(userId) {
        return prisma.notification.findMany({
            where: {
                userId,
            },
            orderBy: {
                createdAt: "desc",
            },
        });
    },
    async getNotificationById(notificationId, userId) {
        return prisma.notification.findFirst({
            where: {
                id: notificationId,
                userId,
            },
        });
    },
    async createNotification(userId, data) {
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
    async markAsRead(notificationId, userId) {
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
    async markAllAsRead(userId) {
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
    async deleteNotification(notificationId, userId) {
        return prisma.notification.deleteMany({
            where: {
                id: notificationId,
                userId,
            },
        });
    },
    // --------------------------------------------------
    // PUSH TOKEN
    // --------------------------------------------------
    async registerPushToken(userId, token, platform) {
        return prisma.pushToken.upsert({
            where: {
                token,
            },
            update: {
                userId,
                platform,
                updatedAt: new Date(),
            },
            create: {
                token,
                platform,
                userId,
            },
        });
    },
    async getUserPushTokens(userId) {
        return prisma.pushToken.findMany({
            where: {
                userId,
            },
        });
    },
};
//# sourceMappingURL=notification.repository.js.map