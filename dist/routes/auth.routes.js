import { Router } from "express";
import { z } from "zod";
import * as authController from "@/controllers/auth.controller";
import { validate } from "@/middleware/validation.middleware";
import { authMiddleware } from "@/middleware/auth.middleware";
const router = Router();
/**
 * REGISTER
 */
const registerSchema = z.object({
    fullName: z.string().min(1, "Full name is required"),
    email: z.string().email("Invalid email address"),
    password: z
        .string()
        .min(8, "Password must be at least 8 characters"),
});
router.post("/register", validate(registerSchema), authController.register);
/**
 * LOGIN
 */
const loginSchema = z.object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(1, "Password is required"),
});
router.post("/login", validate(loginSchema), authController.login);
/**
 * LOGOUT
 *
 * Requires a valid access token:
 *
 * Authorization: Bearer <accessToken>
 */
router.post("/logout", authMiddleware, authController.logout);
/**
 * FORGOT PASSWORD
 */
const forgotPasswordSchema = z.object({
    email: z.string().email("Invalid email address"),
});
router.post("/forgot-password", validate(forgotPasswordSchema), authController.forgotPassword);
export default router;
//# sourceMappingURL=auth.routes.js.map