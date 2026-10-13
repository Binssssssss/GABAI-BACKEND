import bcrypt from "bcryptjs";
// Adjust this import to match how your other repositories import prisma
// (you have both config/prisma.ts and lib/prisma.ts).
import { prisma } from "../config/prisma.js";
import { firebaseAdminAuth } from "../config/firebase-admin.js";
import { AppError } from "../utils/response.js";
const SALT_ROUNDS = 10;
export const DEFAULT_NOTIFICATION_PREFS = {
    pushEnabled: true,
    taskDeadlines: true,
    calendarReminders: true,
    smartReminders: true,
    focusAlerts: true,
    leadMinutes: 15,
};
class AccountService {
    // Returns null when the user has never saved preferences.
    async getNotificationPreferences(userId) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { notificationPrefs: true },
        });
        if (!user)
            throw new AppError("User not found", 404);
        return user.notificationPrefs ?? null;
    }
    async updateNotificationPreferences(userId, prefs) {
        await prisma.user.update({
            where: { id: userId },
            data: { notificationPrefs: prefs },
        });
        return prefs;
    }
    /**
     * Used by the push service. Returns false when the user has
     * turned off this kind of notification.
     */
    async isPushAllowed(userId, type) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { notificationPrefs: true },
        });
        const prefs = {
            ...DEFAULT_NOTIFICATION_PREFS,
            ...(user?.notificationPrefs ?? {}),
        };
        if (!prefs.pushEnabled)
            return false;
        const kind = (type ?? "").toLowerCase();
        if ((kind.includes("deadline") || kind.includes("due")) && !prefs.taskDeadlines) {
            return false;
        }
        if (kind.includes("focus") && !prefs.focusAlerts) {
            return false;
        }
        return true;
    }
    async changePassword(userId, currentPassword, newPassword) {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user)
            throw new AppError("User not found", 404);
        const isValid = await bcrypt.compare(currentPassword, user.password);
        if (!isValid) {
            throw new AppError(user.firebaseUid
                ? "Current password is incorrect. If you signed up with Google, use Forgot Password on the login screen to set a password first."
                : "Current password is incorrect.", 400);
        }
        if (currentPassword === newPassword) {
            throw new AppError("New password must be different from your current password.", 400);
        }
        await prisma.user.update({
            where: { id: userId },
            data: { password: await bcrypt.hash(newPassword, SALT_ROUNDS) },
        });
        return { message: "Password changed successfully." };
    }
    async deleteAccount(userId) {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user)
            throw new AppError("User not found", 404);
        // Every relation in your schema uses onDelete: Cascade,
        // so tasks, notes, transactions, tokens, etc. go with the user.
        await prisma.user.delete({ where: { id: userId } });
        if (user.firebaseUid) {
            try {
                await firebaseAdminAuth.deleteUser(user.firebaseUid);
            }
            catch (error) {
                console.warn("Firebase user cleanup failed:", error);
            }
        }
        return { message: "Account deleted." };
    }
}
export const accountService = new AccountService();
//# sourceMappingURL=account.service.js.map