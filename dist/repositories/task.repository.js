import { prisma } from "../lib/prisma";
export class TaskRepository {
    async findAllByUser(userId, filters) {
        return prisma.task.findMany({
            where: {
                userId,
                ...(filters?.search && {
                    OR: [
                        {
                            title: {
                                contains: filters.search,
                                mode: "insensitive",
                            },
                        },
                        {
                            description: {
                                contains: filters.search,
                                mode: "insensitive",
                            },
                        },
                        {
                            subject: {
                                contains: filters.search,
                                mode: "insensitive",
                            },
                        },
                    ],
                }),
                ...(filters?.category &&
                    filters.category !== "All" && {
                    subject: filters.category,
                }),
                ...(filters?.date && {
                    dueDate: filters.date,
                }),
            },
            include: {
                subTasks: true,
            },
            orderBy: [
                {
                    dueDate: "asc",
                },
                {
                    dueTime: "asc",
                },
            ],
        });
    }
    async findById(id, userId) {
        return prisma.task.findFirst({
            where: {
                id,
                userId,
            },
            include: {
                subTasks: true,
            },
        });
    }
    async findByDate(userId, date) {
        return prisma.task.findMany({
            where: {
                userId,
                dueDate: date,
            },
            include: {
                subTasks: true,
            },
            orderBy: {
                dueTime: "asc",
            },
        });
    }
    async create(userId, data) {
        return prisma.task.create({
            data: {
                title: data.title,
                description: data.description ?? "",
                subject: data.subject,
                priority: data.priority,
                dueDate: data.dueDate,
                dueTime: data.dueTime ?? "",
                hasReminder: data.hasReminder ?? false,
                completed: data.completed ?? false,
                userId,
                subTasks: {
                    create: data.subTasks?.map((subTask) => ({
                        title: subTask.title,
                        completed: subTask.completed ?? false,
                    })) ?? [],
                },
            },
            include: {
                subTasks: true,
            },
        });
    }
    async update(id, userId, data) {
        return prisma.task.update({
            where: {
                id,
            },
            data: {
                ...(data.title !== undefined && {
                    title: data.title,
                }),
                ...(data.description !== undefined && {
                    description: data.description,
                }),
                ...(data.subject !== undefined && {
                    subject: data.subject,
                }),
                ...(data.priority !== undefined && {
                    priority: data.priority,
                }),
                ...(data.dueDate !== undefined && {
                    dueDate: data.dueDate,
                }),
                ...(data.dueTime !== undefined && {
                    dueTime: data.dueTime,
                }),
                ...(data.hasReminder !== undefined && {
                    hasReminder: data.hasReminder,
                }),
                ...(data.completed !== undefined && {
                    completed: data.completed,
                }),
            },
            include: {
                subTasks: true,
            },
        });
    }
    async delete(id, userId) {
        return prisma.task.delete({
            where: {
                id,
            },
        });
    }
    async findUpcomingDeadlines(userId, limit = 3) {
        return prisma.task.findMany({
            where: {
                userId,
                completed: false,
                dueDate: {
                    gte: new Date().toISOString().split("T")[0],
                },
            },
            include: {
                subTasks: true,
            },
            orderBy: [
                {
                    dueDate: "asc",
                },
                {
                    dueTime: "asc",
                },
            ],
            take: limit,
        });
    }
    async reschedule(id, userId, data) {
        return prisma.task.update({
            where: {
                id,
                userId,
            },
            data: {
                dueDate: data.dueDate,
                ...(data.dueTime !== undefined && {
                    dueTime: data.dueTime,
                }),
            },
            include: {
                subTasks: true,
            },
        });
    }
}
export const taskRepository = new TaskRepository();
//# sourceMappingURL=task.repository.js.map