import { taskRepository } from "../repositories/task.repository";
function calculateProgress(subTasks) {
    if (subTasks.length === 0) {
        return 0;
    }
    const completedCount = subTasks.filter((subTask) => subTask.completed).length;
    return Math.round((completedCount / subTasks.length) * 100);
}
function formatCalendarEvent(task) {
    const checklist = task.subTasks.map((subTask) => ({
        id: subTask.id,
        title: subTask.title,
        completed: subTask.completed,
    }));
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
export class TaskService {
    async getAllTasks(userId, filters) {
        const tasks = await taskRepository.findAllByUser(userId, filters);
        return tasks.map(formatCalendarEvent);
    }
    async getTasksByDate(userId, date) {
        const tasks = await taskRepository.findByDate(userId, date);
        return tasks.map(formatCalendarEvent);
    }
    async getTaskById(userId, taskId) {
        const task = await taskRepository.findById(taskId, userId);
        if (!task) {
            throw new Error("Task not found");
        }
        return formatCalendarEvent(task);
    }
    async createTask(userId, data) {
        const task = await taskRepository.create(userId, data);
        return formatCalendarEvent(task);
    }
    async updateTask(userId, taskId, data) {
        const existingTask = await taskRepository.findById(taskId, userId);
        if (!existingTask) {
            throw new Error("Task not found");
        }
        const updatedTask = await taskRepository.update(taskId, userId, data);
        return formatCalendarEvent(updatedTask);
    }
    async deleteTask(userId, taskId) {
        const existingTask = await taskRepository.findById(taskId, userId);
        if (!existingTask) {
            throw new Error("Task not found");
        }
        await taskRepository.delete(taskId, userId);
        return {
            message: "Task deleted successfully",
        };
    }
    async getUpcomingDeadlines(userId) {
        const tasks = await taskRepository.findUpcomingDeadlines(userId, 3);
        return tasks.map(formatCalendarEvent);
    }
    async rescheduleTask(userId, taskId, data) {
        const existingTask = await taskRepository.findById(taskId, userId);
        if (!existingTask) {
            throw new Error("Task not found");
        }
        const updatedTask = await taskRepository.reschedule(taskId, userId, data);
        return formatCalendarEvent(updatedTask);
    }
}
export const taskService = new TaskService();
//# sourceMappingURL=task.service.js.map