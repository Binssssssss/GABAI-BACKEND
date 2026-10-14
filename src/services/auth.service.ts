import bcrypt from "bcryptjs";
import { createHash, randomInt, randomUUID } from "node:crypto";

import { env } from "@/config/env";
import { firebaseAdminAuth } from "@/config/firebase-admin";
import { authRepository } from "@/repositories/auth.repository";
import { userRepository } from "@/repositories/user.repository";
import { sendEmail } from "@/services/email.service";

import {
  LoginInput,
  LoginResponse,
  RegisterInput,
  TokenPayload,
} from "@/types/auth.types";

import { AppError } from "@/utils/response";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
} from "@/utils/jwt";

const SALT_ROUNDS = 10;

/* Email verification settings */
const CODE_TTL_MINUTES = 10;
const RESEND_COOLDOWN_SECONDS = 60;
const MAX_CODE_ATTEMPTS = 5;

type DbUser = NonNullable<Awaited<ReturnType<typeof userRepository.findById>>>;

/* The code is stored hashed, tied to the user id. */
function hashCode(userId: string, code: string): string {
  return createHash("sha256").update(`${userId}:${code}`).digest("hex");
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/* Seconds left before another code may be sent (0 = can send now). */
function cooldownLeft(user: DbUser): number {
  if (!user.emailVerificationSentAt) return 0;

  const elapsed =
    (Date.now() - new Date(user.emailVerificationSentAt).getTime()) / 1000;

  return Math.max(0, Math.ceil(RESEND_COOLDOWN_SECONDS - elapsed));
}

export class AuthService {
  /**
   * Creates (or refreshes) a 6-digit code and emails it with Resend.
   */
  private async sendVerificationCode(user: DbUser) {
    const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
    const firstName = escapeHtml(user.fullName.trim().split(/\s+/)[0] || "there");

    await userRepository.update(user.id, {
      emailVerificationCode: hashCode(user.id, code),
      emailVerificationExpires: new Date(Date.now() + CODE_TTL_MINUTES * 60_000),
      emailVerificationAttempts: 0,
      emailVerificationSentAt: new Date(),
    });

    try {
      await sendEmail({
        to: user.email,
        subject: "Your GabAi verification code",
        text: [
          `Hi ${firstName},`,
          "",
          "Welcome to GabAi! Use this code to verify your email address:",
          "",
          code,
          "",
          `This code expires in ${CODE_TTL_MINUTES} minutes.`,
          "",
          "If you didn't create a GabAi account, you can safely ignore this email.",
          "",
          "— GabAi Team",
        ].join("\n"),
        html: `
          <div style="font-family: Arial, sans-serif; background:#F4F1EC; padding:24px;">
            <div style="max-width:440px; margin:0 auto; background:#FFFFFF; border:1px solid #E8E0D6; border-radius:14px; padding:28px; color:#29231E;">
              <div style="font-size:22px; font-weight:800;">Gab<span style="color:#A97C50;">Ai</span></div>
              <p style="font-size:14px; line-height:22px; margin-top:18px;">Hi ${firstName},</p>
              <p style="font-size:14px; line-height:22px;">Welcome to GabAi! Use this code to verify your email address:</p>
              <div style="font-size:32px; font-weight:800; letter-spacing:10px; text-align:center; background:#F7F1EA; border:1px dashed #A97C50; border-radius:10px; padding:14px; margin:18px 0;">${code}</div>
              <p style="font-size:14px; line-height:22px;">This code expires in <b>${CODE_TTL_MINUTES} minutes</b>.</p>
              <p style="font-size:12px; line-height:18px; color:#8A7D72; margin-top:16px;">If you didn't create a GabAi account, you can safely ignore this email.<br/><br/>— GabAi Team</p>
            </div>
          </div>
        `,
      });

      console.log(`✅ Verification code sent to ${user.email}`);
    } catch (error) {
      console.error("❌ Failed to send verification email:", error);

      throw new AppError(
        "We couldn't send the verification email right now. Please try again.",
        502,
      );
    }
  }

  async register(input: RegisterInput) {
    const existingUser = await userRepository.findByEmail(
      input.email,
    );

    if (existingUser && existingUser.emailVerified) {
      throw new AppError("Email already exists", 409);
    }

    const hashedPassword = await bcrypt.hash(
      input.password,
      SALT_ROUNDS,
    );

    let user: DbUser;

    if (existingUser) {
      /*
       * Registered before but never verified:
       * keep the newest name/password and send a fresh code.
       */
      user = await userRepository.update(existingUser.id, {
        fullName: input.fullName,
        password: hashedPassword,
      });
    } else {
      user = await userRepository.create({
        fullName: input.fullName,
        email: input.email,
        password: hashedPassword,
        emailVerified: false,
      });
    }

    if (cooldownLeft(user) === 0) {
      await this.sendVerificationCode(user);
    }

    return {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      requiresVerification: true,
      message: "We sent a 6-digit verification code to your email.",
    };
  }

  /**
   * POST /auth/verify-email  { email, code }
   */
  async verifyEmail(email: string, code: string) {
    const user = await userRepository.findByEmail(email);

    if (!user) {
      throw new AppError("Invalid verification code.", 400);
    }

    if (user.emailVerified) {
      return { message: "Your email is already verified. You can log in." };
    }

    if (
      !user.emailVerificationCode ||
      !user.emailVerificationExpires ||
      new Date(user.emailVerificationExpires).getTime() < Date.now()
    ) {
      throw new AppError(
        "This code has expired. Please request a new one.",
        400,
        { code: "CODE_EXPIRED" },
      );
    }

    if (user.emailVerificationAttempts >= MAX_CODE_ATTEMPTS) {
      throw new AppError(
        "Too many incorrect attempts. Please request a new code.",
        429,
        { code: "TOO_MANY_ATTEMPTS" },
      );
    }

    const isMatch =
      hashCode(user.id, String(code).trim()) === user.emailVerificationCode;

    if (!isMatch) {
      const attempts = user.emailVerificationAttempts + 1;

      await userRepository.update(user.id, {
        emailVerificationAttempts: attempts,
      });

      const left = MAX_CODE_ATTEMPTS - attempts;

      throw new AppError(
        left > 0
          ? `Incorrect code. You have ${left} attempt${left === 1 ? "" : "s"} left.`
          : "Too many incorrect attempts. Please request a new code.",
        400,
        { code: left > 0 ? "INVALID_CODE" : "TOO_MANY_ATTEMPTS" },
      );
    }

    await userRepository.update(user.id, {
      emailVerified: true,
      emailVerificationCode: null,
      emailVerificationExpires: null,
      emailVerificationAttempts: 0,
    });

    return { message: "Email verified. You can now log in." };
  }

  /**
   * POST /auth/resend-verification  { email }
   */
  async resendVerification(email: string) {
    const user = await userRepository.findByEmail(email);

    // Do not reveal whether an email is registered.
    if (!user || user.emailVerified) {
      return {
        message: "If this email needs verification, a new code has been sent.",
        cooldownSeconds: RESEND_COOLDOWN_SECONDS,
      };
    }

    const wait = cooldownLeft(user);

    if (wait > 0) {
      throw new AppError(
        `Please wait ${wait} seconds before requesting a new code.`,
        429,
        { code: "RESEND_COOLDOWN", retryAfter: wait },
      );
    }

    await this.sendVerificationCode(user);

    return {
      message: "A new verification code has been sent to your email.",
      cooldownSeconds: RESEND_COOLDOWN_SECONDS,
    };
  }

  
async login(input: LoginInput): Promise<LoginResponse> {
  const email = input.email.trim().toLowerCase();

  const user = await authRepository.findUserByEmail(email);

  if (!user) {
    throw new AppError(
      "Invalid email or password",
      401,
    );
  }

  if (!user.password) {
    throw new AppError(
      "This account does not have a password. Please use Google login.",
      401,
    );
  }

  const isPasswordValid = await bcrypt.compare(
    input.password,
    user.password,
  );

  if (!isPasswordValid) {
    throw new AppError(
      "Invalid email or password",
      401,
    );
  }

  /*
   * Email must be verified before logging in.
   * Send a fresh code (unless one was sent in the last minute).
   */
  if (!user.emailVerified) {
    if (cooldownLeft(user) === 0) {
      try {
        await this.sendVerificationCode(user);
      } catch (error) {
        console.error("❌ Could not resend verification code on login:", error);
      }
    }

    throw new AppError(
      "Please verify your email before logging in. We sent a 6-digit code to your email.",
      403,
      { code: "EMAIL_NOT_VERIFIED", email: user.email },
    );
  }

  const tokenPayload: TokenPayload = {
    id: user.id,
    email: user.email,
  };

  const token = generateAccessToken(tokenPayload);
  const refreshToken = generateRefreshToken(
    tokenPayload,
  );

  return {
    token,
    refreshToken,
    user: {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      avatar: user.avatar ?? null,
    },
  };
}


  /**
   * Logout
   *
   * GabAi currently uses stateless JWT authentication.
   *
   * There is no server-side session or refresh-token
   * table in the current Prisma schema.
   *
   * Therefore, there is no database record to delete.
   *
   * The frontend is responsible for removing the
   * access token and refresh token from AsyncStorage.
   */
  async logout(userId: string) {
    return {
      message: "Logged out successfully",
      userId,
    };
  }

  /**
   * Google / Firebase Login
   *
   * Flow:
   * Google Sign-In
   *      ↓
   * Firebase ID Token
   *      ↓
   * Firebase Admin verifies token
   *      ↓
   * Find/Create GabAi user
   *      ↓
   * Generate GabAi JWT
   */
  async googleLogin(idToken: string): Promise<LoginResponse> {
    if (!idToken) {
      throw new AppError(
        "Firebase ID token is required",
        400,
      );
    }

    let decodedToken;

    try {
  decodedToken =
    await firebaseAdminAuth.verifyIdToken(idToken);
} catch (error) {
  console.error(
    "❌ Firebase Admin verifyIdToken error:",
    error,
  );

  throw new AppError(
    "Invalid or expired Firebase token",
    401,
  );
}
    const firebaseUid = decodedToken.uid;
    const email = decodedToken.email;

    if (!email) {
      throw new AppError(
        "Google account email is required",
        400,
      );
    }

    const fullName =
      decodedToken.name ||
      email.split("@")[0];

    /*
     * First, try to find the user through Firebase UID.
     */
    let user = await userRepository.findByFirebaseUid(
      firebaseUid,
    );

    /*
     * If no Firebase UID is linked yet,
     * check whether the email already exists.
     */
    if (!user) {
      user = await userRepository.findByEmail(email);
    }

    /*
     * Create a new GabAi account if the user
     * does not exist yet.
     */
    if (!user) {
      const randomPassword = await bcrypt.hash(
        randomUUID(),
        SALT_ROUNDS,
      );

      user = await userRepository.create({
        fullName,
        email,
        password: randomPassword,
        firebaseUid,
        // Google already verified this email address.
        emailVerified: true,
      });
    }
    /*
     * Existing email/password account:
     * link the Firebase UID to the existing account.
     */
    else if (!user.firebaseUid || !user.emailVerified) {
      user = await userRepository.update(user.id, {
        firebaseUid,
        // Signing in with Google proves the email belongs to the user.
        emailVerified: true,
        emailVerificationCode: null,
        emailVerificationExpires: null,
      });
    }

    /*
     * Generate the same GabAi JWT tokens
     * used by normal email/password login.
     */
    const tokenPayload: TokenPayload = {
      id: user.id,
      email: user.email,
    };

    const token = generateAccessToken(tokenPayload);

    const refreshToken = generateRefreshToken(
      tokenPayload,
    );

    return {
      token,
      refreshToken,
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        avatar: user.avatar ?? null,
      },
    };
  }

  async forgotPassword(email: string) {
    const normalizedEmail = email.trim().toLowerCase();

    const user = await authRepository.findUserByEmail(
      normalizedEmail,
    );

    /*
     * Do not reveal whether an email is registered.
     */
    if (user) {
      const resetToken = generateAccessToken({
        id: user.id,
        email: user.email,
      });

      const resetUrl =
        `${env.CLIENT_URL}/reset-password?token=${resetToken}`;

      try {
        await sendEmail({
          to: user.email,
          subject: "Reset Your GabAi Password",
          text: `
Hello ${user.fullName},

We received a request to reset your GabAi password.

Use the following link to reset your password:

${resetUrl}

If you did not request a password reset, you can safely ignore this email.

GabAi Team
        `.trim(),
          html: `
            <div style="font-family: Arial, sans-serif; line-height: 1.6;">
              <h2>Reset Your GabAi Password</h2>

              <p>Hello ${user.fullName},</p>

              <p>
                We received a request to reset your GabAi password.
              </p>

              <p>
                Click the button below to reset your password:
              </p>

              <p>
                <a
                  href="${resetUrl}"
                  style="
                    display: inline-block;
                    padding: 12px 20px;
                    background-color: #8B5E3C;
                    color: white;
                    text-decoration: none;
                    border-radius: 6px;
                  "
                >
                  Reset Password
                </a>
              </p>

              <p>
                If the button does not work, copy and paste this link
                into your browser:
              </p>

              <p>${resetUrl}</p>

              <p>
                If you did not request a password reset, you can safely
                ignore this email.
              </p>

              <p>
                — GabAi Team
              </p>
            </div>
          `,
        });

        console.log(
          `✅ Password reset email sent to ${user.email}`,
        );
      } catch (error) {
        console.error(
          "❌ Failed to send password reset email:",
          error,
        );

        throw new AppError(
          "Unable to send password reset email",
          500,
        );
      }
    }

    return {
      message:
        "If that email is registered, a reset link has been sent.",
    };
  }

  async resetPassword(token: string, newPassword: string) {
    let decodedToken: TokenPayload;

    try {
      decodedToken = verifyAccessToken(token);
    } catch (error) {
      console.error(
        "❌ Password reset token verification error:",
        error,
      );

      throw new AppError(
        "Invalid or expired password reset link",
        401,
      );
    }

    const user = await authRepository.findUserByEmail(
      decodedToken.email,
    );

    if (!user) {
      throw new AppError(
        "User account not found",
        404,
      );
    }

    const hashedPassword = await bcrypt.hash(
      newPassword,
      SALT_ROUNDS,
    );

    await userRepository.update(user.id, {
      password: hashedPassword,
    });

    return {
      message: "Password reset successfully.",
    };
  }
}

export const authService = new AuthService();
