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
  email: z.string().trim().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters"),
});

router.post(
  "/register",
  validate(registerSchema),
  authController.register,
);

/**
 * LOGIN
 */
const loginSchema = z.object({
  email: z.string().trim().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

router.post(
  "/login",
  validate(loginSchema),
  authController.login,
);

/**
 * GOOGLE LOGIN
 *
 * The frontend sends a Firebase ID token.
 *
 * POST /api/auth/google
 *
 * Body:
 * {
 *   "idToken": "Firebase ID token"
 * }
 */
const googleLoginSchema = z.object({
  idToken: z
    .string()
    .min(1, "Firebase ID token is required"),
});

router.post(
  "/google",
  validate(googleLoginSchema),
  authController.googleLogin,
);

/**
 * LOGOUT
 *
 * Requires a valid access token:
 *
 * Authorization: Bearer <accessToken>
 */
router.post(
  "/logout",
  authMiddleware,
  authController.logout,
);

/**
 * FORGOT PASSWORD
 */
const forgotPasswordSchema = z.object({
  email: z.string().trim().email("Invalid email address"),
});

router.post(
  "/forgot-password",
  validate(forgotPasswordSchema),
  authController.forgotPassword,
);
const resetPasswordSchema = z.object({
  token: z.string().min(1, "Reset token is required"),

  newPassword: z
    .string()
    .min(8, "Password must be at least 8 characters"),
});

router.post(
  "/reset-password",
  validate(resetPasswordSchema),
  authController.resetPassword,
);
export default router;
