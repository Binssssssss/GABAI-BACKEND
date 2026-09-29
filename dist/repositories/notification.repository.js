import { prisma } from "@/lib/prisma";
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
};
//# sourceMappingURL=notification.repository.js.map