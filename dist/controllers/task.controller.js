import { taskService, } from "../services/task.service";
export class TaskController {
    async getAllTasks(req, res, next) {
        try {
            const userId = typeof req.user?.id === "string"
                ? req.user.id
                : undefined;
            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: "Unauthorized",
                });
            }
            const search = typeof req.query.search === "string"
                ? req.query.search
                : undefined;
            const category = typeof req.query.category === "string"
                ? req.query.category
                : undefined;
            const date = typeof req.query.date === "string"
                ? req.query.date
                : undefined;
            const tasks = await taskService.getAllTasks(userId, {
                search,
                category,
                date,
            });
            return res.status(200).json({
                success: true,
                data: tasks,
            });
        }
        catch (error) {
            next(error);
        }
    }
    async getTasksByDate(req, res, next) {
        try {
            const userId = typeof req.user?.id === "string"
                ? req.user.id
                : undefined;
            const date = typeof req.params.date === "string"
                ? req.params.date
                : undefined;
            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: "Unauthorized",
                });
            }
            if (!date) {
                return res.status(400).json({
                    success: false,
                    message: "Date is required",
                });
            }
            const tasks = await taskService.getTasksByDate(userId, date);
            return res.status(200).json({
                success: true,
                data: tasks,
            });
        }
        catch (error) {
            next(error);
        }
    }
    async getTaskById(req, res, next) {
        try {
            const userId = typeof req.user?.id === "string"
                ? req.user.id
                : undefined;
            const id = Array.isArray(req.params.id)
                ? req.params.id[0]
                : req.params.id;
            const taskId = Array.isArray(id) ? id[0] : id;
            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: "Unauthorized",
                });
            }
            const task = await taskService.getTaskById(userId, taskId);
            return res.status(200).json({
                success: true,
                data: task,
            });
        }
        catch (error) {
            next(error);
        }
    }
    async createTask(req, res, next) {
        try {
            const userId = typeof req.user?.id === "string"
                ? req.user.id
                : undefined;
            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: "Unauthorized",
                });
            }
            const task = await taskService.createTask(userId, req.body);
            return res.status(201).json({
                success: true,
                message: "Task created successfully",
                data: task,
            });
        }
        catch (error) {
            next(error);
        }
    }
    async updateTask(req, res, next) {
        try {
            const userId = typeof req.user?.id === "string"
                ? req.user.id
                : undefined;
            const { id } = req.params;
            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: "Unauthorized",
                });
            }
            if (typeof id !== "string") {
                return res.status(400).json({
                    success: false,
                    message: "Invalid task ID",
                });
            }
            const task = await taskService.updateTask(userId, id, req.body);
            return res.status(200).json({
                success: true,
                message: "Task updated successfully",
                data: task,
            });
        }
        catch (error) {
            next(error);
        }
    }
    async deleteTask(req, res, next) {
        try {
            const userId = typeof req.user?.id === "string"
                ? req.user.id
                : undefined;
            const { id } = req.params;
            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: "Unauthorized",
                });
            }
            const result = await taskService.deleteTask(userId, typeof id === "string" ? id : id[0]);
            return res.status(200).json({
                success: true,
                ...result,
            });
        }
        catch (error) {
            next(error);
        }
    }
    async getUpcomingDeadlines(req, res, next) {
        try {
            const userId = typeof req.user?.id === "string"
                ? req.user.id
                : undefined;
            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: "Unauthorized",
                });
            }
            const deadlines = await taskService.getUpcomingDeadlines(userId);
            return res.status(200).json({
                success: true,
                data: deadlines,
            });
        }
        catch (error) {
            next(error);
        }
    }
    async rescheduleTask(req, res, next) {
        try {
            const userId = typeof req.user?.id === "string"
                ? req.user.id
                : undefined;
            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: "Unauthorized",
                });
            }
            const taskId = Array.isArray(req.params.id)
                ? req.params.id[0]
                : req.params.id;
            const { dueDate, dueTime } = req.body;
            if (typeof dueDate !== "string" ||
                !dueDate.trim()) {
                return res.status(400).json({
                    success: false,
                    message: "dueDate is required",
                });
            }
            const updatedTask = await taskService.rescheduleTask(userId, taskId, {
                dueDate,
                dueTime,
            });
            return res.status(200).json({
                success: true,
                message: "Task rescheduled successfully",
                data: updatedTask,
            });
        }
        catch (error) {
            next(error);
        }
    }
}
export const taskController = new TaskController();
//# sourceMappingURL=task.controller.js.map