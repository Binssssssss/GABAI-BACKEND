import { todaysFocusRepository } from "@/repositories/todays-focus.repository";
import { TodaysFocusResponse } from "@/types/todays-focus.types";

function getToday(): string {
  const now = new Date();

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getCountdown(
  dueDate: string,
  dueTime: string,
): string {
  if (!dueTime) {
    return "";
  }

  const due = new Date(`${dueDate}T${dueTime}`);
  const now = new Date();

  const difference = due.getTime() - now.getTime();

  if (difference <= 0) {
    return "Due now";
  }

  const totalMinutes = Math.floor(
    difference / (1000 * 60),
  );

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m left`;
  }

  return `${minutes}m left`;
}

function normalizePriority(
  priority: string,
): TodaysFocusResponse["priority"] {
  const normalized = priority.toLowerCase();

  if (normalized === "high") {
    return "high";
  }

  if (normalized === "medium") {
    return "medium";
  }

  return "low";
}

export const todaysFocusService = {
  async getTodaysFocus(
    userId: string,
  ): Promise<TodaysFocusResponse[]> {
    const today = getToday();

    const tasks =
      await todaysFocusRepository.getTodaysTasks(
        userId,
        today,
      );

    type TodaysTask = Awaited<
      ReturnType<typeof todaysFocusRepository.getTodaysTasks>
    >[number];

    return tasks.map((task: TodaysTask) => ({
      id: task.id,
      title: task.title,
      dueTime: task.dueTime,
      countdown: getCountdown(
        task.dueDate,
        task.dueTime,
      ),
      priority: normalizePriority(task.priority),
      completed: task.completed,
    }));
  },
};