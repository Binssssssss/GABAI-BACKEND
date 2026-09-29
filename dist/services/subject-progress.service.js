import { subjectProgressRepository } from "@/repositories/subject-progress.repository";
export const subjectProgressService = {
    async getSubjectProgress(userId) {
        const tasks = await subjectProgressRepository.getSubjectProgress(userId);
        const subjectMap = new Map();
        for (const task of tasks) {
            const subject = task.subject?.trim();
            if (!subject) {
                continue;
            }
            const existing = subjectMap.get(subject) ?? {
                totalTasks: 0,
                completedTasks: 0,
            };
            existing.totalTasks += 1;
            if (task.completed) {
                existing.completedTasks += 1;
            }
            subjectMap.set(subject, existing);
        }
        const result = [];
        for (const [name, stats] of subjectMap.entries()) {
            const completion = stats.totalTasks === 0
                ? 0
                : Math.round((stats.completedTasks / stats.totalTasks) * 100);
            result.push({
                name,
                completion,
                totalTasks: stats.totalTasks,
                completedTasks: stats.completedTasks,
            });
        }
        return result.sort((a, b) => b.completion - a.completion);
    },
};
//# sourceMappingURL=subject-progress.service.js.map