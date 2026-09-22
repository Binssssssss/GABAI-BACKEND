import { prisma } from "../lib/prisma";
export const academicPressureRepository = {
    async getStudentTasks(userId) {
        return prisma.task.findMany({
            where: {
                userId,
            },
            select: {
                id: true,
                priority: true,
                dueDate: true,
                dueTime: true,
                completed: true,
            },
            orderBy: {
                dueDate: "asc",
            },
        });
    },
};
//# sourceMappingURL=academic-pressure.repository.js.map