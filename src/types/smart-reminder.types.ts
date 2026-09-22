export type SmartReminderType =
  | "overdue_tasks"
  | "urgent_tasks"
  | "upcoming_deadline"
  | "high_priority"
  | "pending_tasks"
  | "no_reminder";

export interface SmartReminderResponse {
  hasReminder: boolean;
  reminderText: string | null;
  type: SmartReminderType;
}