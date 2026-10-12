import * as pushTokenRepository from "../repositories/push-token.repository.js";
export const registerPushToken = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { token, platform } = req.body;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized",
            });
        }
        if (!token || typeof token !== "string") {
            return res.status(400).json({
                success: false,
                message: "Push token is required",
            });
        }
        if (!platform || typeof platform !== "string") {
            return res.status(400).json({
                success: false,
                message: "Platform is required",
            });
        }
        const pushToken = await pushTokenRepository.upsertPushToken(userId, token, platform);
        return res.status(200).json({
            success: true,
            message: "Push token registered successfully",
            data: pushToken,
        });
    }
    catch (error) {
        console.error("Register push token error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to register push token",
        });
    }
};
export const deletePushToken = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { token } = req.body;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized",
            });
        }
        if (!token || typeof token !== "string") {
            return res.status(400).json({
                success: false,
                message: "Push token is required",
            });
        }
        await pushTokenRepository.deletePushToken(userId, token);
        return res.status(200).json({
            success: true,
            message: "Push token deleted successfully",
        });
    }
    catch (error) {
        console.error("Delete push token error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to delete push token",
        });
    }
};
//# sourceMappingURL=push-token.controller.js.map