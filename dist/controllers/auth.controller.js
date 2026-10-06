import { authService } from "../services/auth.service.js";
import { asyncHandler } from "../utils/helper.js";
export const register = asyncHandler(async (req, res) => {
    const user = await authService.register(req.body);
    return res.status(201).json(user);
});
export const login = asyncHandler(async (req, res) => {
    const result = await authService.login(req.body);
    return res.status(200).json(result);
});
export const googleLogin = asyncHandler(async (req, res) => {
    const result = await authService.googleLogin(req.body.idToken);
    return res.status(200).json(result);
});
export const logout = asyncHandler(async (req, res) => {
    const result = await authService.logout(req.user.id);
    return res.status(200).json(result);
});
export const forgotPassword = asyncHandler(async (req, res) => {
    const result = await authService.forgotPassword(req.body.email);
    return res.status(200).json(result);
});
export const resetPassword = asyncHandler(async (req, res) => {
    const result = await authService.resetPassword(req.body.token, req.body.newPassword);
    return res.status(200).json(result);
});
//# sourceMappingURL=auth.controller.js.map