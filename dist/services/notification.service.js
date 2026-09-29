import { notificationRepository, } from "@/repositories/notification.repository";
export const notificationService = {
    async getNotifications(userId) {
        const notifications = await notificationRepository.getUserNotifications(userId);
        return notifications.map((notification) => ({
            id: notification.id,
            title: notification.title,
            message: notification.message,
            type: notification.type,
            time: notification.time,
            read: notification.read,
            icon: notification.icon,
            iconColor: notification.iconColor,
            taskId: notification.taskId ?? undefined,
            assignmentId: notification.assignmentId ?? undefined,
            createdAt: notification.createdAt,
        }));
    },
    async createNotification(userId, data) {
        return notificationRepository.createNotification(userId, data);
    },
    async markAsRead(notificationId, userId) {
        return notificationRepository.markAsRead(notificationId, userId);
    },
    async markAllAsRead(userId) {
        return notificationRepository.markAllAsRead(userId);
    },
    async deleteNotification(notificationId, userId) {
        return notificationRepository.deleteNotification(notificationId, userId);
    },
};
//# sourceMappingURL=notification.service.js.map