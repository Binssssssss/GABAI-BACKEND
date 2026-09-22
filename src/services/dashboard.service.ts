import { dashboardRepository } from "@/repositories/dashboard.repository";

export const dashboardService = {
  async getOverview(userId: string) {
    const taskStats =
      await dashboardRepository.getTaskStats(userId);

    return {
      tasksCount: taskStats.tasksCount,
      deadlinesCount: taskStats.deadlinesCount,

      // Temporary values until Calendar and Wallet
      // backend modules are connected.
      classesCount: 0,
      weeklySpend: "₱0",
    };
  },
};