import { accountService } from "../services/account.service.js";
import { asyncHandler } from "../utils/helper.js";
export const getNotificationPreferences = asyncHandler(async (req, res) => {
    const data = await accountService.getNotificationPreferences(req.user.id);
    return res.status(200).json({ success: true, data });
});
export const updateNotificationPreferences = asyncHandler(async (req, res) => {
    const data = await accountService.updateNotificationPreferences(req.user.id, req.body);
    return res.status(200).json({ success: true, data });
});
export const changePassword = asyncHandler(async (req, res) => {
    const result = await accountService.changePassword(req.user.id, req.body.currentPassword, req.body.newPassword);
    return res.status(200).json({ success: true, ...result });
});
export const deleteAccount = asyncHandler(async (req, res) => {
    const result = await accountService.deleteAccount(req.user.id);
    return res.status(200).json({ success: true, ...result });
});
//# sourceMappingURL=account.controller.js.map