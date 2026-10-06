import { recentActivityService } from "../services/recent-activity.service.js";
import { asyncHandler } from "../utils/helper.js";
export const getRecentActivities = asyncHandler(async (req, res) => {
    const userId = req.user?.id;
    if (!userId) {
        return res.status(401).json({
            success: false,
            message: "Authentication required.",
        });
    }
    const activities = await recentActivityService.getRecentActivities(userId);
    return res.status(200).json({
        success: true,
        data: activities,
    });
});
export const createRecentActivity = asyncHandler(async (req, res) => {
    const userId = req.user?.id;
    if (!userId) {
        return res.status(401).json({
            success: false,
            message: "Authentication required.",
        });
    }
    const activity = await recentActivityService.createActivity(userId, req.body);
    return res.status(201).json({
        success: true,
        message: "Recent activity created successfully.",
        data: activity,
    });
});
export const deleteRecentActivity = asyncHandler(async (req, res) => {
    const userId = req.user?.id;
    if (!userId) {
        return res.status(401).json({
            success: false,
            message: "Authentication required.",
        });
    }
    const result = await recentActivityService.deleteActivity(userId, String(req.params.id));
    return res.status(200).json({
        success: true,
        message: result.message,
    });
});
//# sourceMappingURL=recent-activity.controller.js.map