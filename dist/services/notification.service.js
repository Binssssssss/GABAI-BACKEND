import { notificationRepository } from "../repositories/notification.repository.js";
export const getNotificationsByUser = async (userId) => {
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
};
export const getNotificationById = async (userId, notificationId) => {
    return notificationRepository.getNotificationById(notificationId, userId);
};
export const createNotification = async (userId, data) => {
    return notificationRepository.createNotification(userId, data);
};
export const markNotificationAsRead = async (userId, notificationId) => {
    return notificationRepository.markAsRead(notificationId, userId);
};
export const markAllNotificationsAsRead = async (userId) => {
    return notificationRepository.markAllAsRead(userId);
};
export const deleteNotification = async (userId, notificationId) => {
    return notificationRepository.deleteNotification(notificationId, userId);
};
// --------------------------------------------------
// PUSH TOKEN
// --------------------------------------------------
export const registerPushToken = async (userId, token, platform) => {
    return notificationRepository.registerPushToken(userId, token, platform);
};
export const getUserPushTokens = async (userId) => {
    return notificationRepository.getUserPushTokens(userId);
};
//# sourceMappingURL=notification.service.js.map