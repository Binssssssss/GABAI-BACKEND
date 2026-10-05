import bcrypt from "bcryptjs";

import { env } from "@/config/env";
import { authRepository } from "@/repositories/auth.repository";
import { userRepository } from "@/repositories/user.repository";

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
    const user = await authRepository.findUserByEmail(
      input.email,
    );

    if (!user) {
      throw new AppError(
        "Invalid email or password",
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
   *
   * The userId is kept here so this service can later
   * support server-side token/session revocation if
   * that feature is added.
   */
  async logout(userId: string) {
    return {
      message: "Logged out successfully",
      userId,
    };
  }

  async forgotPassword(email: string) {
    const user = await authRepository.findUserByEmail(
      email,
    );

    /*
     * Do not reveal whether an email is registered.
     */
    if (user) {
      const resetToken = generateAccessToken({
        id: user.id,
        email: user.email,
      });

      /*
       * Development only.
       *
       * Replace this with an actual email provider
       * when password reset is implemented.
       */
      console.log(`Password reset requested for ${email}`);
      console.log(
        `Reset URL: ${env.CLIENT_URL}/reset-password?token=${resetToken}`,
      );
    }

    return {
      message:
        "If that email is registered, a reset link has been sent.",
    };
  }
}

export const authService = new AuthService();