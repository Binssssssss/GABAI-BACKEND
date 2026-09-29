export type PressureLevel = "LOW" | "MEDIUM" | "HIGH";

export interface AcademicPressureResult {
  level: PressureLevel;
  label: string;
  score: number;
  totalTasks: number;
  pendingTasks: number;
  overdueTasks: number;
  urgentTasks: number;
}