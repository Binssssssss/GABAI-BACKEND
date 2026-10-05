import bcrypt from "bcryptjs";
import { randomUUID } from "node:crypto";
import { env } from "@/config/env";
import { firebaseAdminAuth } from "@/config/firebase-admin";
import { authRepository } from "@/repositories/auth.repository";
import { userRepository } from "@/repositories/user.repository";
import { AppError } from "@/utils/response";
import { generateAccessToken, generateRefreshToken, } from "@/utils/jwt";
const SALT_ROUNDS = 10;
export class AuthService {
    async register(input) {
        const existingUser = await userRepository.findByEmail(input.email);
        if (existingUser) {
            throw new AppError("Email already exists", 409);
        }
        const hashedPassword = await bcrypt.hash(input.password, SALT_ROUNDS);
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
    async login(input) {
        const user = await authRepository.findUserByEmail(input.email);
        if (!user) {
            throw new AppError("Invalid email or password", 401);
        }
        const isPasswordValid = await bcrypt.compare(input.password, user.password);
        if (!isPasswordValid) {
            throw new AppError("Invalid email or password", 401);
        }
        const tokenPayload = {
            id: user.id,
            email: user.email,
        };
        const token = generateAccessToken(tokenPayload);
        const refreshToken = generateRefreshToken(tokenPayload);
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
    async logout(userId) {
        return {
            message: "Logged out successfully",
            userId,
        };
    }
    async forgotPassword(email) {
        const user = await authRepository.findUserByEmail(email);
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
            console.log(`Reset URL: ${env.CLIENT_URL}/reset-password?token=${resetToken}`);
        }
        return {
            message: "If that email is registered, a reset link has been sent.",
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
    async googleLogin(idToken) {
        if (!idToken) {
            throw new AppError("Firebase ID token is required", 400);
        }
        let decodedToken;
        try {
            decodedToken =
                await firebaseAdminAuth.verifyIdToken(idToken);
        }
        catch {
            throw new AppError("Invalid or expired Firebase token", 401);
        }
        const firebaseUid = decodedToken.uid;
        const email = decodedToken.email;
        if (!email) {
            throw new AppError("Google account email is required", 400);
        }
        const fullName = decodedToken.name ||
            email.split("@")[0];
        /*
         * First, try to find the user through Firebase UID.
         */
        let user = await userRepository.findByFirebaseUid(firebaseUid);
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
            const randomPassword = await bcrypt.hash(randomUUID(), SALT_ROUNDS);
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
        const tokenPayload = {
            id: user.id,
            email: user.email,
        };
        const token = generateAccessToken(tokenPayload);
        const refreshToken = generateRefreshToken(tokenPayload);
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
}
export const authService = new AuthService();
//# sourceMappingURL=auth.service.js.map