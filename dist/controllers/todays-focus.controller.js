import { todaysFocusService } from "../services/todays-focus.service.js";
import { asyncHandler } from "../utils/helper.js";
export const getTodaysFocus = asyncHandler(async (req, res) => {
    const userId = req.user?.id;
    if (!userId) {
        return res.status(401).json({
            success: false,
            message: "Authentication required.",
        });
    }
    const tasks = await todaysFocusService.getTodaysFocus(userId);
    return res.status(200).json({
        success: true,
        data: tasks,
    });
});
//# sourceMappingURL=todays-focus.controller.js.map