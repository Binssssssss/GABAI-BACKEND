import { taskRepository } from "../repositories/task.repository";
class AppError extends Error {
    statusCode;
    constructor(message, statusCode) {
        super(message);
        this.name = "AppError";
        this.statusCode = statusCode;
    }
}
// ===============================
// CALCULATE SUBTASK PROGRESS
// ===============================
function calculateProgress(subTasks) {
    if (subTasks.length === 0) {
        return 0;
    }
    const completedCount = subTasks.filter((subTask) => subTask.completed).length;
    return Math.round((completedCount / subTasks.length) * 100);
}
// ===============================
// FORMAT TASK AS CALENDAR EVENT
// ===============================
function formatCalendarEvent(task) {
    const checklist = Array.isArray(task.subTasks)
        ? task.subTasks.map((subTask) => ({
            id: subTask.id,
            title: subTask.title,
            completed: subTask.completed,
        }))
        : [];
    return {
        id: task.id,
        title: task.title,
        description: task.description,
        subject: task.subject,
        date: task.dueDate,
        time: task.dueTime &&
            task.dueTime.trim() !== ""
            ? task.dueTime
            : null,
        priority: task.priority,
        category: task.subject,
        isAllDay: !task.dueTime ||
            task.dueTime.trim() === "",
        duration: null,
        checklist,
        progress: calculateProgress(checklist),
        completed: task.completed,
        hasReminder: task.hasReminder,
    };
}
// ===============================
// VALIDATE TASK ID
// ===============================
function validateTaskId(taskId) {
    if (!taskId ||
        typeof taskId !== "string" ||
        taskId.trim() === "") {
        throw new AppError("Task ID is required.", 400);
    }
}
// ===============================
// TASK SERVICE
// ===============================
export class TaskService {
    // ===============================
    // GET ALL TASKS
    // ===============================
    async getAllTasks(userId, filters) {
        const tasks = await taskRepository.findAllByUser(userId, filters);
        return tasks.map(formatCalendarEvent);
    }
    // ===============================
    // GET TASKS BY FILTER
    // ===============================
    async getTasksByFilter(userId, filter) {
        const allowedFilters = [
            "all",
            "today",
            "upcoming",
            "completed",
            "pending",
            "overdue",
        ];
        const normalizedFilter = filter.trim().toLowerCase();
        if (!allowedFilters.includes(normalizedFilter)) {
            throw new AppError(`Invalid task filter: ${filter}`, 400);
        }
        const tasks = await taskRepository.findByFilter(userId, normalizedFilter);
        return tasks.map(formatCalendarEvent);
    }
    // ===============================
    // GET TASKS BY DATE
    // ===============================
    async getTasksByDate(userId, date) {
        if (!date || date.trim() === "") {
            throw new AppError("Date is required.", 400);
        }
        const tasks = await taskRepository.findByDate(userId, date);
        return tasks.map(formatCalendarEvent);
    }
    // ===============================
    // GET TASK BY ID
    // ===============================
    async getTaskById(taskId, userId) {
        const normalizedTaskId = taskId?.trim();
        console.log("========== GET TASK DEBUG ==========");
        console.log("Task ID:", normalizedTaskId);
        console.log("User ID:", userId);
        console.log("====================================");
        if (!normalizedTaskId) {
            throw new AppError("Task ID is required.", 400);
        }
        const task = await taskRepository.findById(normalizedTaskId, userId);
        console.log("Repository result:", task);
        if (!task) {
            console.warn(`[TaskService] Task not found. taskId=${normalizedTaskId}, userId=${userId}`);
            throw new AppError("Task not found.", 404);
        }
        return formatCalendarEvent(task);
    }
    // ===============================
    // CREATE TASK
    // ===============================
    async createTask(userId, data) {
        const task = await taskRepository.create(userId, data);
        return formatCalendarEvent(task);
    }
    // ===============================
    // UPDATE TASK
    // ===============================
    async updateTask(userId, taskId, data) {
        validateTaskId(taskId);
        const normalizedTaskId = taskId.trim();
        const existingTask = await taskRepository.findById(normalizedTaskId, userId);
        if (!existingTask) {
            throw new AppError("Task not found.", 404);
        }
        const updatedTask = await taskRepository.update(normalizedTaskId, userId, data);
        if (!updatedTask) {
            throw new AppError("Task not found.", 404);
        }
        return formatCalendarEvent(updatedTask);
    }
    // ===============================
    // DELETE TASK
    // ===============================
    async deleteTask(userId, taskId) {
        validateTaskId(taskId);
        const normalizedTaskId = taskId.trim();
        const existingTask = await taskRepository.findById(normalizedTaskId, userId);
        if (!existingTask) {
            throw new AppError("Task not found.", 404);
        }
        await taskRepository.delete(normalizedTaskId, userId);
        return {
            message: "Task deleted successfully",
        };
    }
    // ===============================
    // UPCOMING DEADLINES
    // ===============================
    async getUpcomingDeadlines(userId) {
        const tasks = await taskRepository.findUpcomingDeadlines(userId, 3);
        return tasks.map(formatCalendarEvent);
    }
    // ===============================
    // RESCHEDULE TASK
    // ===============================
    async rescheduleTask(userId, taskId, data) {
        validateTaskId(taskId);
        const normalizedTaskId = taskId.trim();
        const existingTask = await taskRepository.findById(normalizedTaskId, userId);
        if (!existingTask) {
            throw new AppError("Task not found.", 404);
        }
        const updatedTask = await taskRepository.reschedule(normalizedTaskId, userId, data);
        if (!updatedTask) {
            throw new AppError("Task not found.", 404);
        }
        return formatCalendarEvent(updatedTask);
    }
    // ===============================
    // UPDATE SUBTASK
    // ===============================
    async updateSubTask(userId, taskId, subTaskId, data) {
        validateTaskId(taskId);
        if (!subTaskId ||
            typeof subTaskId !== "string" ||
            subTaskId.trim() === "") {
            throw new AppError("Subtask ID is required.", 400);
        }
        const normalizedTaskId = taskId.trim();
        const normalizedSubTaskId = subTaskId.trim();
        const task = await taskRepository.findById(normalizedTaskId, userId);
        if (!task) {
            throw new AppError("Task not found.", 404);
        }
        const updatedSubTask = await taskRepository.updateSubTask(userId, normalizedTaskId, normalizedSubTaskId, data);
        if (!updatedSubTask) {
            throw new AppError("Subtask not found.", 404);
        }
        const updatedTask = await taskRepository.findById(normalizedTaskId, userId);
        if (!updatedTask) {
            throw new AppError("Task not found.", 404);
        }
        return formatCalendarEvent(updatedTask);
    }
    // ===============================
    // BULK COMPLETE TASKS
    // ===============================
    async bulkComplete(input, userId) {
        const taskIds = [
            ...new Set(input.taskIds
                .filter((id) => typeof id === "string")
                .map((id) => id.trim())
                .filter(Boolean)),
        ];
        if (taskIds.length === 0) {
            throw new AppError("At least one task must be selected.", 400);
        }
        const result = await taskRepository.bulkComplete(taskIds, userId);
        if (result.count === 0) {
            throw new AppError("No selected tasks were found.", 404);
        }
        return {
            count: result.count,
            message: `${result.count} task${result.count === 1 ? "" : "s"} completed successfully.`,
        };
    }
    // ===============================
    // BULK DELETE TASKS
    // ===============================
    async bulkDelete(input, userId) {
        const taskIds = [
            ...new Set(input.taskIds
                .filter((id) => typeof id === "string")
                .map((id) => id.trim())
                .filter(Boolean)),
        ];
        if (taskIds.length === 0) {
            throw new AppError("At least one task must be selected.", 400);
        }
        const result = await taskRepository.bulkDelete(taskIds, userId);
        if (result.count === 0) {
            throw new AppError("No selected tasks were found.", 404);
        }
        return {
            count: result.count,
            message: `${result.count} task${result.count === 1 ? "" : "s"} deleted successfully.`,
        };
    }
    // ===============================
    // GET TASK ANALYTICS
    // ===============================
    async getAnalytics(userId) {
        const analytics = await taskRepository.getAnalytics(userId);
        const { totalTasks, completedTasks, pendingTasks, tasks, } = analytics;
        // ===============================
        // COMPLETION RATE
        // ===============================
        const completionRate = totalTasks > 0
            ? Math.round((completedTasks / totalTasks) *
                100)
            : 0;
        // ===============================
        // CURRENT WEEK
        // ===============================
        const today = new Date();
        const startOfWeek = new Date(today);
        const currentDay = startOfWeek.getDay();
        const difference = currentDay === 0
            ? -6
            : 1 - currentDay;
        startOfWeek.setDate(startOfWeek.getDate() +
            difference);
        startOfWeek.setHours(0, 0, 0, 0);
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(endOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);
        // ===============================
        // WEEKLY COMPLETION
        // ===============================
        const weeklyCompletion = [
            {
                day: "Mon",
                count: 0,
            },
            {
                day: "Tue",
                count: 0,
            },
            {
                day: "Wed",
                count: 0,
            },
            {
                day: "Thu",
                count: 0,
            },
            {
                day: "Fri",
                count: 0,
            },
            {
                day: "Sat",
                count: 0,
            },
            {
                day: "Sun",
                count: 0,
            },
        ];
        for (const task of tasks) {
            if (!task.completed ||
                !task.dueDate) {
                continue;
            }
            const dueDate = new Date(`${task.dueDate}T00:00:00`);
            if (dueDate >= startOfWeek &&
                dueDate <= endOfWeek) {
                const dayIndex = dueDate.getDay();
                const weekIndex = dayIndex === 0
                    ? 6
                    : dayIndex - 1;
                weeklyCompletion[weekIndex].count += 1;
            }
        }
        // ===============================
        // PREVIOUS WEEK
        // ===============================
        const previousWeekStart = new Date(startOfWeek);
        previousWeekStart.setDate(previousWeekStart.getDate() -
            7);
        const previousWeekEnd = new Date(startOfWeek);
        previousWeekEnd.setDate(previousWeekEnd.getDate() -
            1);
        previousWeekEnd.setHours(23, 59, 59, 999);
        let previousWeekCompleted = 0;
        for (const task of tasks) {
            if (!task.completed ||
                !task.dueDate) {
                continue;
            }
            const dueDate = new Date(`${task.dueDate}T00:00:00`);
            if (dueDate >= previousWeekStart &&
                dueDate <= previousWeekEnd) {
                previousWeekCompleted += 1;
            }
        }
        // ===============================
        // CURRENT WEEK TOTAL
        // ===============================
        const currentWeekCompleted = weeklyCompletion.reduce((total, item) => total + item.count, 0);
        // ===============================
        // WEEKLY PRODUCTIVITY
        // ===============================
        let weeklyProductivity = 0;
        if (previousWeekCompleted > 0) {
            weeklyProductivity =
                Math.round(((currentWeekCompleted -
                    previousWeekCompleted) /
                    previousWeekCompleted) *
                    100);
        }
        else if (currentWeekCompleted > 0) {
            weeklyProductivity = 100;
        }
        // ===============================
        // BADGES
        // ===============================
        const badges = [];
        if (completedTasks >= 5) {
            badges.push({
                id: "five-tasks",
                title: "Task Crusher",
                description: "Completed at least 5 tasks.",
                icon: "zap",
                type: "completion",
            });
        }
        if (completedTasks >= 10) {
            badges.push({
                id: "ten-tasks",
                title: "Task Master",
                description: "Completed at least 10 tasks.",
                icon: "award",
                type: "completion",
            });
        }
        if (totalTasks > 0 &&
            pendingTasks === 0) {
            badges.push({
                id: "all-complete",
                title: "All Clear",
                description: "Completed all your tasks.",
                icon: "check-circle",
                type: "completion",
            });
        }
        // ===============================
        // RETURN ANALYTICS
        // ===============================
        return {
            totalTasks,
            completedTasks,
            pendingTasks,
            completionRate,
            weeklyProductivity,
            weeklyCompletion,
            badges,
        };
    }
}
// ===============================
// SERVICE INSTANCE
// ===============================
export const taskService = new TaskService();
//# sourceMappingURL=task.service.js.map