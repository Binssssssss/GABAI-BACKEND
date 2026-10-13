import { prisma } from "../lib/prisma.js";
import { firebaseAdminMessaging } from "../config/firebase-admin.js";
import { accountService } from "./account.service.js";
const ANDROID_CHANNEL_ID = "gabai-default";
const INVALID_TOKEN_CODES = new Set([
    "messaging/registration-token-not-registered",
    "messaging/invalid-registration-token",
]);
export async function sendPushNotification(input) {
    const { userId, title, message, type, time = "Just now", icon = "bell", iconColor = "#8B5E3C", taskId, assignmentId, data = {}, } = input;
    // Save the notification in the database.
    const notification = await prisma.notification.create({
        data: {
            userId,
            title,
            message,
            type,
            time,
            icon,
            iconColor,
            taskId,
            assignmentId,
        },
    });
    const pushTokens = await prisma.pushToken.findMany({
        where: { userId },
    });
    if (pushTokens.length === 0) {
        console.log(`[PushNotification] No registered devices for user ${userId}.`);
        return {
            notification,
            successCount: 0,
            failureCount: 0,
        };
    }
    let successCount = 0;
    let failureCount = 0;
    const invalidTokens = [];
    // FCM multicast supports up to 500 tokens per batch.
    for (let index = 0; index < pushTokens.length; index += 500) {
        const batch = pushTokens.slice(index, index + 500);
        const response = await firebaseAdminMessaging.sendEachForMulticast({
            tokens: batch.map((item) => item.token),
            notification: {
                title,
                body: message,
            },
            data: {
                ...data,
                type,
                ...(taskId ? { taskId } : {}),
                ...(assignmentId ? { assignmentId } : {}),
            },
            android: {
                priority: "high",
                notification: {
                    channelId: ANDROID_CHANNEL_ID,
                    sound: "default",
                },
            },
        });
        successCount += response.successCount;
        failureCount += response.failureCount;
        response.responses.forEach((result, tokenIndex) => {
            if (result.success)
                return;
            const code = result.error?.code ?? "unknown";
            const token = batch[tokenIndex].token;
            console.error(`[PushNotification] Failed for token: ${code}`);
            if (INVALID_TOKEN_CODES.has(code)) {
                invalidTokens.push(token);
            }
        });
    }
    if (invalidTokens.length > 0) {
        await prisma.pushToken.deleteMany({
            where: {
                token: { in: invalidTokens },
            },
        });
    }
    console.log(`[PushNotification] ${type}: ${successCount} sent, ${failureCount} failed.`);
    return {
        notification,
        successCount,
        failureCount,
    };
}
/**
 * Prevent notification failures from interrupting
 * the main app operation.
 */
export async function sendPushNotificationSafely(input) {
    try {
        // Respect the user's notification preferences.
        if (!(await accountService.isPushAllowed(input.userId, input.type))) {
            return;
        }
        await sendPushNotification(input);
    }
    catch (error) {
        console.error(`[PushNotification] Failed to process "${input.type}":`, error);
    }
}
/**
 * Send each smart reminder type only once per user per
 * Philippine calendar day.
 */
export async function sendSmartReminderOncePerDay(input) {
    try {
        const today = new Date().toLocaleDateString("en-CA", {
            timeZone: "Asia/Manila",
        });
        const start = new Date(`${today}T00:00:00+08:00`);
        const end = new Date(`${today}T23:59:59.999+08:00`);
        const existing = await prisma.notification.findFirst({
            where: {
                userId: input.userId,
                type: input.type,
                createdAt: {
                    gte: start,
                    lte: end,
                },
            },
            select: { id: true },
        });
        if (existing)
            return;
        await sendPushNotificationSafely(input);
    }
    catch (error) {
        console.error("[PushNotification] Smart reminder check failed:", error);
    }
}
//# sourceMappingURL=push-notification.service.js.map