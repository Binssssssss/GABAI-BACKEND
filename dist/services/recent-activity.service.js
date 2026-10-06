import { recentActivityRepository } from "../repositories/recent-activity.repository.js";
export const recentActivityService = {
    async getRecentActivities(userId) {
        const activities = await recentActivityRepository.getRecentActivities(userId, 5);
        return activities;
    },
    async createActivity(userId, input) {
        if (!input.icon) {
            throw new Error("Activity icon is required.");
        }
        if (!input.text || input.text.trim().length === 0) {
            throw new Error("Activity text is required.");
        }
        if (!input.type) {
            throw new Error("Activity type is required.");
        }
        const activity = await recentActivityRepository.createActivity(userId, {
            icon: input.icon,
            text: input.text.trim(),
            type: input.type,
        });
        await recentActivityRepository.deleteOldActivities(userId, 20);
        return activity;
    },
    async deleteActivity(userId, activityId) {
        const result = await recentActivityRepository.deleteActivity(activityId, userId);
        if (result.count === 0) {
            throw new Error("Recent activity not found.");
        }
        return {
            message: "Recent activity deleted successfully.",
        };
    },
};
//# sourceMappingURL=recent-activity.service.js.map