export interface ChecklistItem {
  id: string;
  title: string;
  completed: boolean;
}

export interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  subject: string;
  date: string;
  time: string | null;
  priority: string;
  category: string;
  isAllDay: boolean;
  duration: number | null;
  checklist: ChecklistItem[];
  progress: number;
  completed: boolean;
  hasReminder: boolean;
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  subject: string;
  priority: string;
  dueDate: string;
  dueTime?: string;
  hasReminder?: boolean;
  completed?: boolean;
  subTasks?: {
    title: string;
    completed?: boolean;
  }[];
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  subject?: string;
  priority?: string;
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
export interface RescheduleTaskInput {
  dueDate: string;
  dueTime?: string;
}