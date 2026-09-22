export type TaskPriority = "low" | "medium" | "high";

export interface TodaysFocusResponse {
  id: string;
  title: string;
  dueTime: string;
  countdown: string;
  priority: TaskPriority;
  completed: boolean;
}