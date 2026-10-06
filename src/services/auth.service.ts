import bcrypt from "bcryptjs";
import { randomUUID } from "node:crypto";

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

export class AuthService {
  async register(input: RegisterInput) {
    const existingUser = await userRepository.findByEmail(
      input.email,
    );

    if (existingUser) {
      throw new AppError("Email already exists", 409);
    }

    const hashedPassword = await bcrypt.hash(
      input.password,
      SALT_ROUNDS,
    );

    const user = await userRepository.create({
      fullName: input.fullName,
      email: input.email,
      password: hashedPassword,
    });

    return {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
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
      });
    }
    /*
     * Existing email/password account:
     * link the Firebase UID to the existing account.
     */
    else if (!user.firebaseUid) {
      user = await userRepository.update(user.id, {
        firebaseUid,
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
