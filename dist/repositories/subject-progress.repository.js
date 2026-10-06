import { prisma } from "../lib/prisma.js";
export const subjectProgressRepository = {
    async getSubjectProgress(userId) {
        const tasks = await prisma.task.findMany({
            where: {
                userId,
            },
            select: {
                subject: true,
                completed: true,
            },
        });
        return tasks;
    },
};
//# sourceMappingURL=subject-progress.repository.js.map