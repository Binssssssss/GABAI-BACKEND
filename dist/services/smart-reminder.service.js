import { smartReminderRepository } from "../repositories/smart-reminder.repository.js";
import { sendSmartReminderOncePerDay, } from "./push-notification.service.js";
async function returnReminder(userId, reminder) {
    if (reminder.hasReminder && reminder.reminderText) {
        await sendSmartReminderOncePerDay({
            userId,
            title: "GabAi Smart Reminder",
            message: reminder.reminderText,
            type: `smart_${reminder.type}`,
            data: {
                reminderType: reminder.type,
            },
        });
    }
    return reminder;
}
export const smartReminderService = {
    async getSmartReminder(userId) {
        const tasks = await smartReminderRepository.getUserTasks(userId);
        if (tasks.length === 0) {
            return {
                hasReminder: false,
                reminderText: null,
                type: "no_reminder",
            };
        }
        const now = new Date();
        // Task dueDate is stored as a YYYY-MM-DD string.
        const today = [
            now.getFullYear(),
            String(now.getMonth() + 1).padStart(2, "0"),
            String(now.getDate()).padStart(2, "0"),
        ].join("-");
        // 1. Overdue tasks
        const overdueTasks = tasks.filter((task) => task.dueDate && task.dueDate < today);
        if (overdueTasks.length > 0) {
            const count = overdueTasks.length;
            return returnReminder(userId, {
                hasReminder: true,
                reminderText: count === 1
                    ? "You have 1 overdue task. Consider completing it as soon as possible."
                    : `You have ${count} overdue tasks. Consider prioritizing them first.`,
                type: "overdue_tasks",
            });
        }
        // 2. High-priority tasks due today
        const urgentTasks = tasks.filter((task) => task.dueDate === today &&
            task.priority.toLowerCase() === "high");
        if (urgentTasks.length > 0) {
            const count = urgentTasks.length;
            return returnReminder(userId, {
                hasReminder: true,
                reminderText: count === 1
                    ? "You have a high-priority task due today. Consider completing it first."
                    : `You have ${count} high-priority tasks due today. Consider completing the most urgent one first.`,
                type: "urgent_tasks",
            });
        }
        // 3. Other tasks due today
        const todayTasks = tasks.filter((task) => task.dueDate === today);
        if (todayTasks.length > 0) {
            const count = todayTasks.length;
            return returnReminder(userId, {
                hasReminder: true,
                reminderText: count === 1
                    ? "You have 1 task due today. Don't forget to complete it."
                    : `You have ${count} tasks due today. Consider planning your time to finish them.`,
                type: "upcoming_deadline",
            });
        }
        // 4. High-priority pending tasks
        const highPriorityTasks = tasks.filter((task) => task.priority.toLowerCase() === "high");
        if (highPriorityTasks.length > 0) {
            return returnReminder(userId, {
                hasReminder: true,
                reminderText: `You have ${highPriorityTasks.length} high-priority pending task${highPriorityTasks.length > 1 ? "s" : ""}. Consider working on them soon.`,
                type: "high_priority",
            });
        }
        // 5. Many pending tasks
        if (tasks.length >= 5) {
            return returnReminder(userId, {
                hasReminder: true,
                reminderText: `You have ${tasks.length} pending tasks. Consider organizing your schedule and prioritizing your most important tasks.`,
                type: "pending_tasks",
            });
        }
        // No reminder needed
        return {
            hasReminder: false,
            reminderText: null,
            type: "no_reminder",
        };
    },
};
//# sourceMappingURL=smart-reminder.service.js.map