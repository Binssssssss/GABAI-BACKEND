export type TaskPriority = "High" | "Medium" | "Low";

export interface CreateTaskInput {
  title: string;
  description?: string;
  subject: string;
  priority: TaskPriority;
  dueDate: string;
  dueTime: string;
  hasReminder?: boolean;
  subTasks?: string[];
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  subject?: string;
  priority?: TaskPriority;
  dueDate?: string;
  dueTime?: string;
  hasReminder?: boolean;
  completed?: boolean;
  subTasks?: string[];
}