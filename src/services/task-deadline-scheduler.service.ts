import { prisma } from "@/lib/prisma";
import { firebaseAdminMessaging } from "@/config/firebase-admin";

const CHECK_INTERVAL_MS = 60_000;
const REMINDER_WINDOW_MS = 30 * 60_000;
const PHILIPPINE_TIMEZONE = "Asia/Manila";

// Interpret task dates and times in Philippine time (UTC+8).
function getDeadlineTimestamp(
  dueDate: string,
  dueTime: string,
): number | null {
  const date = dueDate.trim();

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return null;
  }

  const time = dueTime.trim();
  let hours = 23;
  let minutes = 59;

  if (time) {
    const match = time.match(
      /^(\d{1,2}):(\d{2})(?:\s*(AM|PM))?$/i,
    );

    if (!match) {
      return null;
    }

    hours = Number(match[1]);
    minutes = Number(match[2]);

    const meridiem = match[3]?.toUpperCase();

    if (meridiem) {
      if (hours < 1 || hours > 12) {
        return null;
      }

      if (meridiem === "AM" && hours === 12) {
        hours = 0;
      }

      if (meridiem === "PM" && hours !== 12) {
        hours += 12;
      }
    }

    if (hours > 23 || minutes > 59) {
      return null;
    }
  }

  const timestamp = Date.parse(
    `${date}T${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:00+08:00`,
  );

  return Number.isNaN(timestamp) ? null : timestamp;
}

/** "3:00 PM" in Philippine time. */
function formatDeadlineTime(timestamp: number): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: PHILIPPINE_TIMEZONE,
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(timestamp));
}

/** "today" / "tomorrow" / "Oct 16", in Philippine time. */
function formatDeadlineDay(timestamp: number, now: number): string {
  const dayKey = (value: number) =>
    new Intl.DateTimeFormat("en-CA", {
      timeZone: PHILIPPINE_TIMEZONE,
    }).format(new Date(value));

  if (dayKey(timestamp) === dayKey(now)) return "today";
  if (dayKey(timestamp) === dayKey(now + 24 * 60 * 60_000)) return "tomorrow";

  return new Intl.DateTimeFormat("en-US", {
    timeZone: PHILIPPINE_TIMEZONE,
    month: "short",
    day: "numeric",
  }).format(new Date(timestamp));
}

/** "25 minutes" / "1 minute". */
function formatMinutesLeft(minutes: number): string {
  const value = Math.max(1, minutes);
  return `${value} ${value === 1 ? "minute" : "minutes"}`;
}

let isChecking = false;

export async function checkTaskDeadlineReminders(): Promise<void> {
  if (isChecking) {
    console.log(
      "[DeadlineReminder] Previous check is still running. Skipping.",
    );
    return;
  }

  isChecking = true;

  try {
    const now = Date.now();

    console.log(
      `[DeadlineReminder] Checking at ${new Date(now).toISOString()} | ` +
        `Philippine time: ${new Date(now).toLocaleString("en-PH", {
          timeZone: PHILIPPINE_TIMEZONE,
        })}`,
    );

    const tasks = await prisma.task.findMany({
      where: {
        hasReminder: true,
        completed: false,
        reminderSentAt: null,
      },
    });

    console.log(
      `[DeadlineReminder] Eligible tasks retrieved: ${tasks.length}`,
    );

    for (const task of tasks) {
      try {
        const deadline = getDeadlineTimestamp(
          task.dueDate,
          task.dueTime,
        );

        if (deadline === null) {
          console.warn(
            `[DeadlineReminder] Invalid date/time for task ${task.id}: ` +
              `dueDate=${task.dueDate}, dueTime=${task.dueTime}`,
          );
          continue;
        }

        const minutesUntilDeadline = Math.round(
          (deadline - now) / 60_000,
        );

        console.log(
          `[DeadlineReminder] Task "${task.title}" (${task.id}) | ` +
            `Minutes remaining: ${minutesUntilDeadline}`,
        );

        // Only send before the deadline, within the next 30 minutes.
        if (
          deadline <= now ||
          deadline > now + REMINDER_WINDOW_MS
        ) {
          console.log(
            `[DeadlineReminder] Skipped task ${task.id}: ` +
              "outside the 30-minute reminder window.",
          );
          continue;
        }

        // Exact deadline text, e.g. "today at 3:00 PM" and "25 minutes".
        const deadlineTime = formatDeadlineTime(deadline);
        const deadlineDay = formatDeadlineDay(deadline, now);
        const timeLeft = formatMinutesLeft(minutesUntilDeadline);

        const pushTokens = await prisma.pushToken.findMany({
          where: {
            userId: task.userId,
          },
        });

        if (pushTokens.length === 0) {
          console.warn(
            `[DeadlineReminder] No registered push tokens for user ${task.userId}`,
          );
          continue;
        }

        console.log(
          `[DeadlineReminder] Found ${pushTokens.length} push token(s) ` +
            `for task ${task.id}.`,
        );

        const response =
          await firebaseAdminMessaging.sendEachForMulticast({
            tokens: pushTokens.map((item) => item.token),

            notification: {
              title: "Upcoming Task Deadline",
              body:
                `"${task.title}" is due ${deadlineDay} at ${deadlineTime} ` +
                `(${timeLeft} left). Don't forget to finish it!`,
            },

            data: {
              type: "task_deadline",
              taskId: task.id,
            },

            android: {
              priority: "high",
              notification: {
                channelId: "default",
                sound: "default",
              },
            },
          });

        console.log(
          `[DeadlineReminder] FCM result for task ${task.id}: ` +
            `${response.successCount} succeeded, ` +
            `${response.failureCount} failed.`,
        );

        // Log each failure and collect invalid tokens.
        const invalidTokens: string[] = [];

        response.responses.forEach((result, index) => {
          if (result.success) {
            return;
          }

          const errorCode = result.error?.code ?? "unknown";
          const errorMessage =
            result.error?.message ?? "Unknown Firebase error";

          console.error(
            `[DeadlineReminder] Token ${index} failed: ` +
              `${errorCode} - ${errorMessage}`,
          );

          if (
            errorCode ===
              "messaging/registration-token-not-registered" ||
            errorCode ===
              "messaging/invalid-registration-token"
          ) {
            invalidTokens.push(pushTokens[index].token);
          }
        });

        if (invalidTokens.length > 0) {
          await prisma.pushToken.deleteMany({
            where: {
              token: {
                in: invalidTokens,
              },
            },
          });

          console.log(
            `[DeadlineReminder] Removed ${invalidTokens.length} invalid token(s).`,
          );
        }

        // Do not mark the reminder as sent if every push failed.
        if (response.successCount === 0) {
          console.error(
            `[DeadlineReminder] No successful FCM sends for task ${task.id}.`,
          );
          continue;
        }

        await prisma.notification.create({
          data: {
            userId: task.userId,
            taskId: task.id,
            title: "Upcoming Task Deadline",
            message:
              `"${task.title}" is due ${deadlineDay} at ${deadlineTime} (${timeLeft} left).`,
            type: "task_deadline",
            time: `Due ${deadlineDay} at ${deadlineTime}`,
            icon: "clock",
            iconColor: "#8B5E3C",
          },
        });

        await prisma.task.update({
          where: {
            id: task.id,
          },
          data: {
            reminderSentAt: new Date(),
          },
        });

        console.log(
          `[DeadlineReminder] Sent for task ${task.id}; ` +
            `successful devices: ${response.successCount}.`,
        );
      } catch (error) {
        console.error(
          `[DeadlineReminder] Failed for task ${task.id}:`,
          error,
        );
      }
    }
  } catch (error) {
    console.error(
      "[DeadlineReminder] Scheduler check failed:",
      error,
    );
  } finally {
    isChecking = false;
  }
}

export function startTaskDeadlineReminderScheduler(): void {
  console.log("[DeadlineReminder] Scheduler started.");

  // Run immediately on startup.
  void checkTaskDeadlineReminders();

  // Check again every minute.
  setInterval(() => {
    void checkTaskDeadlineReminders();
  }, CHECK_INTERVAL_MS);
}