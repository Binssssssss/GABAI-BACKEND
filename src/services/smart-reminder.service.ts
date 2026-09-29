import { smartReminderRepository } from "@/repositories/smart-reminder.repository";
import {
  SmartReminderResponse,
  SmartReminderType,
} from "@/types/smart-reminder.types";

export const smartReminderService = {
  async getSmartReminder(
    userId: string,
  ): Promise<SmartReminderResponse> {
    const tasks =
      await smartReminderRepository.getUserTasks(userId);

    if (tasks.length === 0) {
      return {
        hasReminder: false,
        reminderText: null,
        type: "no_reminder",
      };
    }

    const now = new Date();

    /*
     * Get today's date in YYYY-MM-DD format.
     *
     * Your Task model currently stores dueDate as String,
     * so we compare it using this format.
     */
    const today = [
      now.getFullYear(),
      String(now.getMonth() + 1).padStart(2, "0"),
      String(now.getDate()).padStart(2, "0"),
    ].join("-");

    /*
     * 1. Check overdue tasks
     */
    const overdueTasks = tasks.filter(
      (task) => task.dueDate && task.dueDate < today,
    );

    if (overdueTasks.length > 0) {
      const count = overdueTasks.length;

      return {
        hasReminder: true,
        reminderText:
          count === 1
            ? `You have 1 overdue task. Consider completing it as soon as possible.`
            : `You have ${count} overdue tasks. Consider prioritizing them first.`,
        type: "overdue_tasks",
      };
    }

    /*
     * 2. Check high-priority tasks due today
     */
    const urgentTasks = tasks.filter(
      (task) =>
        task.dueDate === today &&
        task.priority.toLowerCase() === "high",
    );

    if (urgentTasks.length > 0) {
      const count = urgentTasks.length;

      return {
        hasReminder: true,
        reminderText:
          count === 1
            ? `You have a high-priority task due today. Consider completing it first.`
            : `You have ${count} high-priority tasks due today. Consider completing the most urgent one first.`,
        type: "urgent_tasks",
      };
    }

    /*
     * 3. Check other tasks due today
     */
    const todayTasks = tasks.filter(
      (task) => task.dueDate === today,
    );

    if (todayTasks.length > 0) {
      const count = todayTasks.length;

      return {
        hasReminder: true,
        reminderText:
          count === 1
            ? `You have 1 task due today. Don't forget to complete it.`
            : `You have ${count} tasks due today. Consider planning your time to finish them.`,
        type: "upcoming_deadline",
      };
    }

    /*
     * 4. Check high-priority pending tasks
     */
    const highPriorityTasks = tasks.filter(
      (task) =>
        task.priority.toLowerCase() === "high",
    );

    if (highPriorityTasks.length > 0) {
      return {
        hasReminder: true,
        reminderText:
          `You have ${highPriorityTasks.length} high-priority pending task${
            highPriorityTasks.length > 1 ? "s" : ""
          }. Consider working on them soon.`,
        type: "high_priority",
      };
    }

    /*
     * 5. Check if student has many pending tasks
     */
    if (tasks.length >= 5) {
      return {
        hasReminder: true,
        reminderText:
          `You have ${tasks.length} pending tasks. Consider organizing your schedule and prioritizing your most important tasks.`,
        type: "pending_tasks",
      };
    }

    /*
     * No reminder needed
     */
    return {
      hasReminder: false,
      reminderText: null,
      type: "no_reminder",
    };
  },
};