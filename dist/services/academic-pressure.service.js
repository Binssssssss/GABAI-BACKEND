import { academicPressureRepository } from "../repositories/academic-pressure.repository";
export const academicPressureService = {
    async calculatePressure(userId) {
        const tasks = await academicPressureRepository.getStudentTasks(userId);
        const now = new Date();
        let pendingTasks = 0;
        let overdueTasks = 0;
        let urgentTasks = 0;
        let score = 0;
        for (const task of tasks) {
            // Completed tasks do not contribute to academic pressure.
            if (task.completed) {
                continue;
            }
            pendingTasks++;
            const priority = task.priority.toUpperCase();
            // Priority score
            if (priority === "HIGH") {
                score += 3;
                urgentTasks++;
            }
            else if (priority === "MEDIUM") {
                score += 2;
            }
            else {
                score += 1;
            }
            /*
             * Your dueDate and dueTime are Strings,
             * so we combine them into one JavaScript Date.
             *
             * Example:
             * dueDate = "2026-09-21"
             * dueTime = "15:30"
             */
            if (task.dueDate) {
                const dateTimeString = task.dueTime
                    ? `${task.dueDate}T${task.dueTime}`
                    : `${task.dueDate}T23:59:59`;
                const dueDate = new Date(dateTimeString);
                // Check if the date is valid
                if (!Number.isNaN(dueDate.getTime())) {
                    const difference = dueDate.getTime() - now.getTime();
                    const hoursUntilDue = difference / (1000 * 60 * 60);
                    // Already overdue
                    if (difference < 0) {
                        overdueTasks++;
                        score += 4;
                    }
                    // Due within 24 hours
                    else if (hoursUntilDue <= 24) {
                        urgentTasks++;
                        score += 3;
                    }
                    // Due within 3 days
                    else if (hoursUntilDue <= 72) {
                        score += 2;
                    }
                }
            }
        }
        let level;
        if (score >= 10) {
            level = "HIGH";
        }
        else if (score >= 5) {
            level = "MEDIUM";
        }
        else {
            level = "LOW";
        }
        const labels = {
            LOW: "Low Pressure",
            MEDIUM: "Medium Pressure",
            HIGH: "High Pressure",
        };
        return {
            level,
            label: labels[level],
            score,
            totalTasks: tasks.length,
            pendingTasks,
            overdueTasks,
            urgentTasks,
        };
    },
};
//# sourceMappingURL=academic-pressure.service.js.map