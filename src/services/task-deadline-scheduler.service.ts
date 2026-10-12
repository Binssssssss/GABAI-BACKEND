
import { prisma } from "@/lib/prisma";
import { firebaseAdminMessaging } from "@/config/firebase-admin";

const CHECK_INTERVAL_MS = 60_000;
const REMINDER_WINDOW_MS = 30 * 60_000;

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
      if (hours < 1 || hours > 12) return null;

      if (meridiem === "AM" && hours === 12) hours = 0;
      if (meridiem === "PM" && hours !== 12) hours += 12;
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

let isChecking = false;

export async function checkTaskDeadlineReminders(): Promise<void> {
  if (isChecking) return;

  isChecking = true;

  try {
    const now = Date.now();

    const tasks = await prisma.task.findMany({
      where: {
        hasReminder: true,
        completed: false,
        reminderSentAt: null,
      },
    });

    for (const task of tasks) {
      try {
        const deadline = getDeadlineTimestamp(
          task.dueDate,
          task.dueTime,
        );

        if (deadline === null) {
          console.warn(
            `[DeadlineReminder] Invalid date/time for task ${task.id}`,
          );
          continue;
        }

        // Send once when the deadline is within the next 30 minutes.
        if (
          deadline <= now ||
          deadline > now + REMINDER_WINDOW_MS
        ) {
          continue;
        }

        const pushTokens = await prisma.pushToken.findMany({
          where: { userId: task.userId },
        });

        if (pushTokens.length === 0) {
          console.warn(
            `[DeadlineReminder] No registered push tokens for user ${task.userId}`,
          );
          continue;
        }

        const response =
          await firebaseAdminMessaging.sendEachForMulticast({
            tokens: pushTokens.map((item) => item.token),
            notification: {
              title: "Upcoming Task Deadline",
              body: `"${task.title}" is due in 30 minutes or less. Don't forget to finish it!`,
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

        // Remove expired or invalid FCM tokens.
        const invalidTokens = pushTokens
          .filter((_, index) => {
            const result = response.responses[index];

            return (
              !result.success &&
              (
                result.error?.code ===
                  "messaging/registration-token-not-registered" ||
                result.error?.code ===
                  "messaging/invalid-registration-token"
              )
            );
          })
          .map((item) => item.token);

        if (invalidTokens.length > 0) {
          await prisma.pushToken.deleteMany({
            where: {
              token: { in: invalidTokens },
            },
          });
        }

        // Do not mark the reminder as sent if every push failed.
        if (response.successCount === 0) {
          console.error(
            `[DeadlineReminder] FCM failed for task ${task.id}`,
          );
          continue;
        }

        await prisma.notification.create({
          data: {
            userId: task.userId,
            taskId: task.id,
            title: "Upcoming Task Deadline",
            message: `"${task.title}" is due in 30 minutes or less.`,
            type: "task_deadline",
            time: "30 minutes before deadline",
            icon: "clock",
            iconColor: "#8B5E3C",
          },
        });

        await prisma.task.update({
          where: { id: task.id },
          data: { reminderSentAt: new Date() },
        });

        console.log(
          `[DeadlineReminder] Sent for task ${task.id}; successful devices: ${response.successCount}`,
        );
      } catch (error) {
        console.error(
          `[DeadlineReminder] Failed for task ${task.id}:`,
          error,
        );
      }
    }
  } catch (error) {
    console.error("[DeadlineReminder] Scheduler check failed:", error);
  } finally {
    isChecking = false;
  }
}

export function startTaskDeadlineReminderScheduler(): void {
  console.log("[DeadlineReminder] Scheduler started.");

  // Check immediately on startup, then every minute.
  void checkTaskDeadlineReminders();

  setInterval(() => {
    void checkTaskDeadlineReminders();
  }, CHECK_INTERVAL_MS);
}
