import { prisma } from "@/lib/prisma";
export const todaysFocusRepository = {
    async getTodaysTasks(userId, today) {
        return prisma.task.findMany({
            where: {
                userId,
                dueDate: today,
            },
            orderBy: [
                {
                    completed: "asc",
                },
                {
                    dueTime: "asc",
                },
            ],
            take: 3,
            select: {
                id: true,
                title: true,
                dueTime: true,
                priority: true,
                completed: true,
                dueDate: true,
            },
        });
    },
};
//# sourceMappingURL=todays-focus.repository.js.map