import { prisma } from "@/lib/prisma";
import { firebaseAdminMessaging } from "@/config/firebase-admin";
import { accountService } from "@/services/account.service";


export type PushNotificationInput = {
  userId: string;
  title: string;
  message: string;
  type: string;
  time?: string;
  icon?: string;
  iconColor?: string;
  taskId?: string;
  assignmentId?: string;
  data?: Record<string, string>;
};

const ANDROID_CHANNEL_ID = "gabai-default";

const INVALID_TOKEN_CODES = new Set([
  "messaging/registration-token-not-registered",
  "messaging/invalid-registration-token",
]);

export async function sendPushNotification(
  input: PushNotificationInput,
) {
  const {
    userId,
    title,
    message,
    type,
    time = "Just now",
    icon = "bell",
    iconColor = "#8B5E3C",
    taskId,
    assignmentId,
    data = {},
  } = input;

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
    console.log(
      `[PushNotification] No registered devices for user ${userId}.`,
    );

    return {
      notification,
      successCount: 0,
      failureCount: 0,
    };
  }

  let successCount = 0;
  let failureCount = 0;
  const invalidTokens: string[] = [];

  // FCM multicast supports up to 500 tokens per batch.
  for (let index = 0; index < pushTokens.length; index += 500) {
    const batch = pushTokens.slice(index, index + 500);

    const response =
      await firebaseAdminMessaging.sendEachForMulticast({
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
      if (result.success) return;

      const code = result.error?.code ?? "unknown";
      const token = batch[tokenIndex].token;

      console.error(
        `[PushNotification] Failed for token: ${code}`,
      );

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

  console.log(
    `[PushNotification] ${type}: ${successCount} sent, ${failureCount} failed.`,
  );

  return {
    notification,
    successCount,
    failureCount,
  };
}

/**
 * Save a notification to the in-app 🔔 list only (no phone push).
 * Used for confirmations of things the user just did, e.g. "Task Added".
 */
export async function createInAppNotification(
  input: PushNotificationInput,
): Promise<void> {
  try {
    await prisma.notification.create({
      data: {
        userId: input.userId,
        title: input.title,
        message: input.message,
        type: input.type,
        time: input.time ?? "Just now",
        icon: input.icon ?? "bell",
        iconColor: input.iconColor ?? "#8B5E3C",
        taskId: input.taskId,
        assignmentId: input.assignmentId,
      },
    });
  } catch (error) {
    console.error(
      `[InAppNotification] Failed to save "${input.type}":`,
      error,
    );
  }
}

/**
 * Prevent notification failures from interrupting
 * the main app operation.
 */
export async function sendPushNotificationSafely(
  input: PushNotificationInput,
): Promise<void> {
  try {
    // Respect the user's notification preferences.
    if (!(await accountService.isPushAllowed(input.userId, input.type))) {
      return;
    }

    await sendPushNotification(input);
  } catch (error) {
    console.error(
      `[PushNotification] Failed to process "${input.type}":`,
      error,
    );
  }
}

/**
 * Send each smart reminder type only once per user per
 * Philippine calendar day.
 */
export async function sendSmartReminderOncePerDay(
  input: PushNotificationInput,
): Promise<void> {
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

    if (existing) return;

    await sendPushNotificationSafely(input);
  } catch (error) {
    console.error(
      "[PushNotification] Smart reminder check failed:",
      error,
    );
  }
}
