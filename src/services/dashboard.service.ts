import {
  DashboardResponse,
  DashboardTask,
  DashboardDeadline,
  DashboardSubject,
  DashboardTimelineItem,
  DashboardPriority,
  AcademicPressure,
} from "../types/dashboard.types";

import {
  dashboardRepository,
} from "../repositories/dashboard.repository";

export class DashboardService {

  async getDashboard(
    userId: string,
  ): Promise<DashboardResponse> {

    const today =
      this.getTodayDate();

    const [
      focusTasksData,
      deadlinesData,
      todayTasksData,
      subjectTasksData,
      notificationsData,
      focusSessionData,
      recentActivitiesData,
      allTasksData,
    ] = await Promise.all([

      dashboardRepository.getFocusTasks(
        userId,
        today,
      ),

      dashboardRepository.getUpcomingDeadlines(
        userId,
        today,
      ),

      dashboardRepository.getTodayTasks(
        userId,
        today,
      ),

      dashboardRepository.getSubjectTasks(
        userId,
      ),

      dashboardRepository.getNotifications(
        userId,
      ),

      dashboardRepository.getActiveFocusSession(
        userId,
      ),

      dashboardRepository.getRecentActivities(
        userId,
      ),

      dashboardRepository.getAllTasks(
        userId,
      ),
    ]);

    // =========================
    // FOCUS TASKS
    // =========================

    const focusTasks: DashboardTask[] =
      focusTasksData.map((task) => ({
        id: task.id,
        title: task.title,
        subject: task.subject,
        dueTime: task.dueTime,
        priority: this.normalizePriority(
          task.priority,
        ),
        countdown:
          task.dueDate === today
            ? "Today"
            : this.getCountdown(
                task.dueDate,
              ),
        completed: task.completed,
      }));

    // =========================
    // DEADLINES
    // =========================

    const deadlines: DashboardDeadline[] =
      deadlinesData.map((task) => {

        const total =
          task.subTasks.length;

        const completed =
          task.subTasks.filter(
            (subTask) =>
              subTask.completed,
          ).length;

        const completion =
          total === 0
            ? 0
            : Math.round(
                (completed / total) * 100,
              );

        return {
          id: task.id,
          subject: task.subject,
          assignment: task.title,
          countdown:
            this.getCountdown(
              task.dueDate,
            ),
          priority:
            this.normalizePriority(
              task.priority,
            ),
          completion,
        };
      });

    // =========================
    // TODAY'S SCHEDULE
    // =========================

    const timelineItems:
      DashboardTimelineItem[] =
      todayTasksData.map((task) => ({
        id: task.id,
        time: this.formatTime(
          task.dueTime,
        ),
        type: "task",
        title: task.title,
        status: task.completed
          ? "Completed"
          : "Pending",
        deadline: this.formatTime(
          task.dueTime,
        ),
      }));

    // =========================
    // SUBJECTS
    // =========================

    const subjects =
      this.buildSubjects(
        subjectTasksData,
      );

    // =========================
    // QUICK OVERVIEW
    // =========================

    const pendingTasks =
      allTasksData.filter(
        (task) => !task.completed,
      ).length;

    const upcomingDeadlines =
      allTasksData.filter(
        (task) =>
          !task.completed &&
          task.dueDate >= today,
      ).length;

    const quickOverview = {
      tasksCount: pendingTasks,
      deadlinesCount:
        upcomingDeadlines,
      classesCount: 0,
      weeklySpend: "₱0",
    };

    // =========================
    // ACADEMIC PRESSURE
    // =========================

    const academicPressure =
      this.calculateAcademicPressure(
        allTasksData,
        today,
      );

    // =========================
    // FOCUS SESSION
    // =========================

    const focusSession =
      focusSessionData
        ? {
            id: focusSessionData.id,
            duration:
              focusSessionData.duration,
            remainingTime:
              focusSessionData.remainingTime,
            targetHours:
              focusSessionData.targetHours,
            status:
              focusSessionData.status,
            startedAt:
              focusSessionData.startedAt
                ?.toISOString() ?? null,
            endedAt:
              focusSessionData.endedAt
                ?.toISOString() ?? null,
          }
        : null;

    // =========================
    // RECENT ACTIVITIES
    // =========================

    const recentActivities =
      recentActivitiesData.map(
        (activity) => ({
          id: activity.id,
          icon: activity.icon,
          text: activity.text,
          type: activity.type,
          createdAt:
            activity.createdAt.toISOString(),
        }),
      );

    // =========================
    // RETURN
    // =========================

    return {
      focusTasks,
      deadlines,
      subjects,
      timelineItems,

      quickOverview,

      smartReminders:
        notificationsData,

      academicPressure,

      focusSession,

      recentActivities,
    };
  }

  // ==================================
  // SUBJECT BUILDER
  // ==================================

  private buildSubjects(
    tasks: {
      subject: string;
      completed: boolean;
    }[],
  ): DashboardSubject[] {

    const map = new Map<
      string,
      {
        pending: number;
        completed: number;
      }
    >();

    for (const task of tasks) {

      if (!map.has(task.subject)) {
        map.set(task.subject, {
          pending: 0,
          completed: 0,
        });
      }

      const subject =
        map.get(task.subject)!;

      if (task.completed) {
        subject.completed++;
      } else {
        subject.pending++;
      }
    }

    return Array.from(
      map.entries(),
    ).map(
      ([name, data]) => {

        const total =
          data.pending +
          data.completed;

        const completion =
          total === 0
            ? 0
            : Math.round(
                (data.completed /
                  total) *
                  100,
              );

        return {
          name,
          pending: data.pending,
          completed: data.completed,
          quiz: "None Scheduled",
          projectStatus: "N/A",
          completion,
        };
      },
    );
  }

  // ==================================
  // ACADEMIC PRESSURE
  // ==================================

  private calculateAcademicPressure(
    tasks: {
      dueDate: string;
      completed: boolean;
    }[],
    today: string,
  ): AcademicPressure {

    const pending =
      tasks.filter(
        (task) => !task.completed,
      );

    const overdue =
      pending.filter(
        (task) =>
          task.dueDate < today,
      );

    const upcoming =
      pending.filter(
        (task) =>
          task.dueDate >= today,
      );

    let score =
      pending.length * 5 +
      overdue.length * 15 +
      upcoming.length * 3;

    score =
      Math.min(score, 100);

    let level:
      | "Low"
      | "Moderate"
      | "High";

    if (score >= 70) {
      level = "High";
    } else if (score >= 40) {
      level = "Moderate";
    } else {
      level = "Low";
    }

    return {
      score,
      level,
      pendingTasks: pending.length,
      overdueTasks: overdue.length,
      upcomingDeadlines:
        upcoming.length,
    };
  }

  // ==================================
  // PRIORITY
  // ==================================

  private normalizePriority(
    priority: string,
  ): DashboardPriority {

    const value =
      priority.toLowerCase();

    if (value === "high") {
      return "High";
    }

    if (value === "low") {
      return "Low";
    }

    return "Medium";
  }

  // ==================================
  // TODAY
  // ==================================

  private getTodayDate(): string {

    const now = new Date();

    const year =
      now.getFullYear();

    const month =
      String(
        now.getMonth() + 1,
      ).padStart(2, "0");

    const day =
      String(
        now.getDate(),
      ).padStart(2, "0");

    return `${year}-${month}-${day}`;
  }

  // ==================================
  // COUNTDOWN
  // ==================================

  private getCountdown(
    dueDate: string,
  ): string {

    const today =
      this.parseDate(
        this.getTodayDate(),
      );

    const deadline =
      this.parseDate(dueDate);

    const difference =
      deadline.getTime() -
      today.getTime();

    const days = Math.ceil(
      difference /
        (1000 * 60 * 60 * 24),
    );

    if (days < 0) {
      return "Overdue";
    }

    if (days === 0) {
      return "Due today";
    }

    if (days === 1) {
      return "1 day left";
    }

    return `${days} days left`;
  }

  // ==================================
  // DATE PARSER
  // ==================================

  private parseDate(
    dateString: string,
  ): Date {

    const [
      year,
      month,
      day,
    ] = dateString
      .split("-")
      .map(Number);

    return new Date(
      year,
      month - 1,
      day,
    );
  }

  // ==================================
  // TIME FORMATTER
  // ==================================

  private formatTime(
    time: string,
  ): string {

    if (!time) {
      return "12:00 AM";
    }

    const match =
      time.match(
        /^(\d{1,2}):(\d{2})$/,
      );

    if (!match) {
      return time;
    }

    let hour =
      Number(match[1]);

    const minute =
      match[2];

    const period =
      hour >= 12
        ? "PM"
        : "AM";

    hour =
      hour % 12;

    if (hour === 0) {
      hour = 12;
    }

    return `${String(hour).padStart(
      2,
      "0",
    )}:${minute} ${period}`;
  }
}

export const dashboardService =
  new DashboardService();