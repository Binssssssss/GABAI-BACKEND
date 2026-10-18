import bcrypt from "bcryptjs";

// Adjust this import to match how your other repositories import prisma
// (you have both config/prisma.ts and lib/prisma.ts).
import { prisma } from "@/config/prisma";
import { firebaseAdminAuth } from "@/config/firebase-admin";
import { AppError } from "@/utils/response";
import { notifyPasswordChanged } from "@/services/security-notification.service";

const SALT_ROUNDS = 10;

export interface NotificationPrefs {
  pushEnabled: boolean;
  taskDeadlines: boolean;
  calendarReminders: boolean;
  smartReminders: boolean;
  focusAlerts: boolean;
  leadMinutes: 15 | 60 | 1440;
  snoozeEnabled?: boolean;
  snoozeMinutes?: 5 | 10 | 15 | 30;
  ringCount?: 1 | 3 | 5;
}

export const DEFAULT_NOTIFICATION_PREFS: NotificationPrefs = {
  pushEnabled: true,
  taskDeadlines: true,
  calendarReminders: true,
  smartReminders: true,
  focusAlerts: true,
  leadMinutes: 15,
  snoozeEnabled: true,
  snoozeMinutes: 5,
  ringCount: 3,
};

const PROFILE_SELECT = {
  id: true,
  fullName: true,
  email: true,
  avatar: true,
  authProvider: true,
} as const;

class AccountService {
  async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: PROFILE_SELECT,
    });

    if (!user) throw new AppError("User not found", 404);

    return user;
  }

  /**
   * Update the user's name and/or profile photo.
   * `avatar: null` removes the photo; leaving it out keeps the current one.
   */
  async updateProfile(
    userId: string,
    data: { fullName?: string; avatar?: string | null },
  ) {
    const update: { fullName?: string; avatar?: string | null } = {};

    if (typeof data.fullName === "string") {
      update.fullName = data.fullName.trim().replace(/\s+/g, " ");
    }

    if (data.avatar !== undefined) {
      update.avatar = data.avatar;
    }

    return prisma.user.update({
      where: { id: userId },
      data: update,
      select: PROFILE_SELECT,
    });
  }

  // Returns null when the user has never saved preferences.
  async getNotificationPreferences(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { notificationPrefs: true },
    });

    if (!user) throw new AppError("User not found", 404);

    return user.notificationPrefs ?? null;
  }

  async updateNotificationPreferences(userId: string, prefs: NotificationPrefs) {
    await prisma.user.update({
      where: { id: userId },
      data: { notificationPrefs: prefs as any },
    });

    return prefs;
  }

  /**
   * Used by the push service. Returns false when the user has
   * turned off this kind of notification.
   */
  async isPushAllowed(userId: string, type?: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { notificationPrefs: true },
    });

    const prefs = {
      ...DEFAULT_NOTIFICATION_PREFS,
      ...((user?.notificationPrefs as object | null) ?? {}),
    };

    if (!prefs.pushEnabled) return false;

    const kind = (type ?? "").toLowerCase();

    if (
      (kind.includes("deadline") || kind.includes("due") || kind.includes("overdue")) &&
      !prefs.taskDeadlines
    ) {
      return false;
    }

    if (kind.includes("focus") && !prefs.focusAlerts) {
      return false;
    }

    return true;
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) throw new AppError("User not found", 404);

    // Google accounts manage their password in their Google Account.
    if (user.authProvider === "google") {
      throw new AppError(
        "This account uses Google sign-in. Change your password in your Google Account.",
        403,
      );
    }

    const isValid = await bcrypt.compare(currentPassword, user.password);

    if (!isValid) {
      throw new AppError("Current password is incorrect.", 400);
    }

    if (currentPassword === newPassword) {
      throw new AppError("New password must be different from your current password.", 400);
    }

    await prisma.user.update({
      where: { id: userId },
      data: { password: await bcrypt.hash(newPassword, SALT_ROUNDS) },
    });

    // Security alert: email + push.
    await notifyPasswordChanged(user);

    return { message: "Password changed successfully." };
  }

  async deleteAccount(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) throw new AppError("User not found", 404);

    // Every relation in your schema uses onDelete: Cascade,
    // so tasks, notes, transactions, tokens, etc. go with the user.
    await prisma.user.delete({ where: { id: userId } });

    if (user.firebaseUid) {
      try {
        await firebaseAdminAuth.deleteUser(user.firebaseUid);
      } catch (error) {
        console.warn("Firebase user cleanup failed:", error);
      }
    }

    return { message: "Account deleted." };
  }
}

export const accountService = new AccountService();