export interface ChecklistItem {
  id: string;
  title: string;
  completed: boolean;
}

export type TaskCategory =
  | "Assignment"
  | "Exam"
  | "Class"
  | "Meeting"
  | "Personal";

export type TaskPriority =
  | "High"
  | "Medium"
  | "Low";

export interface CreateTaskSubTaskInput {
  title: string;
  completed?: boolean;
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  subject: TaskCategory;
  priority: TaskPriority;
  dueDate: string;
  dueTime?: string;
  hasReminder?: boolean;
  completed?: boolean;
  subTasks?: CreateTaskSubTaskInput[];
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  subject?: TaskCategory;
  priority?: TaskPriority;
  dueDate?: string;
  dueTime?: string;
  hasReminder?: boolean;
  completed?: boolean;
}

export interface RescheduleTaskInput {
  dueDate: string;
  dueTime?: string;
}

export interface TaskFilters {
  search?: string;
  category?: string;
  date?: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  subject: string;
  category: string;
  date: string;
  time: string | null;
  priority: string;
  isAllDay: boolean;
  duration: number | null;
  checklist: ChecklistItem[];
  progress: number;
  completed: boolean;
  hasReminder: boolean;
}
export interface UpdateSubTaskInput {
  completed: boolean;
}