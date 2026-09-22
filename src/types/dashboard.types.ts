export type DashboardPriority =
  | "High"
  | "Medium"
  | "Low";

export type DashboardTimelineType =
  | "class"
  | "task"
  | "event"
  | "reminder";

export interface DashboardTask {
  id: string;
  title: string;
  subject: string;
  dueTime: string;
  priority: DashboardPriority;
  countdown: string;
  completed: boolean;
}

export interface DashboardDeadline {
  id: string;
  subject: string;
  assignment: string;
  countdown: string;
  priority: DashboardPriority;
  completion: number;
}

export interface DashboardSubject {
  name: string;
  pending: number;
  completed: number;
  quiz: string;
  projectStatus: string;
  completion: number;
}

export interface DashboardTimelineItem {
  id: string;
  time: string;
  type: DashboardTimelineType;
  title: string;
  status?: string;
  deadline?: string;
}

export interface QuickOverview {
  tasksCount: number;
  deadlinesCount: number;
  classesCount: number;
  weeklySpend: string;
}

export interface SmartReminder {
  id: string;
  title: string;
  message: string;
  type: string;
  time: string;
  read: boolean;
}

export interface AcademicPressure {
  score: number;
  level: "Low" | "Moderate" | "High";
  pendingTasks: number;
  overdueTasks: number;
  upcomingDeadlines: number;
}

export interface FocusSessionData {
  id: string | null;
  duration: number;
  remainingTime: number;
  targetHours: number;
  status: string;
  startedAt: string | null;
  endedAt: string | null;
}

export interface RecentActivityItem {
  id: string;
  icon: string;
  text: string;
  type: string;
  createdAt: string;
}

export interface DashboardResponse {
  focusTasks: DashboardTask[];
  deadlines: DashboardDeadline[];
  subjects: DashboardSubject[];
  timelineItems: DashboardTimelineItem[];
  quickOverview: QuickOverview;
  smartReminders: SmartReminder[];
  academicPressure: AcademicPressure;
  focusSession: FocusSessionData | null;
  recentActivities: RecentActivityItem[];
}