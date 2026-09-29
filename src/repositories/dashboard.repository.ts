import { prisma } from "../lib/prisma";

export class DashboardRepository {

  // =========================
  // FOCUS TASKS
  // =========================

  async getFocusTasks(
    userId: string,
    today: string,
  ) {
    return prisma.task.findMany({
      where: {
        userId,
        OR: [
          {
            dueDate: today,
          },
          {
            priority: "High",
          },
        ],
      },
      orderBy: [
        {
          completed: "asc",
        },
        {
          dueDate: "asc",
        },
        {
          dueTime: "asc",
        },
      ],
      take: 5,
      select: {
        id: true,
        title: true,
        subject: true,
        dueDate: true,
        dueTime: true,
        priority: true,
        completed: true,
      },
    });
  }

  // =========================
  // UPCOMING DEADLINES
  // =========================

  async getUpcomingDeadlines(
    userId: string,
    today: string,
  ) {
    return prisma.task.findMany({
      where: {
        userId,
        completed: false,
        dueDate: {
          gte: today,
        },
      },
      orderBy: {
        dueDate: "asc",
      },
      take: 5,
      select: {
        id: true,
        title: true,
        subject: true,
        dueDate: true,
        dueTime: true,
        priority: true,
        completed: true,
        subTasks: {
          select: {
            id: true,
            completed: true,
          },
        },
      },
    });
  }

  // =========================
  // TODAY'S SCHEDULE
  // =========================

  async getTodayTasks(
    userId: string,
    today: string,
  ) {
    return prisma.task.findMany({
      where: {
        userId,
        dueDate: today,
      },
      orderBy: {
        dueTime: "asc",
      },
      take: 10,
      select: {
        id: true,
        title: true,
        dueTime: true,
        completed: true,
      },
    });
  }

  // =========================
  // SUBJECT DATA
  // =========================

  async getSubjectTasks(
    userId: string,
  ) {
    return prisma.task.findMany({
      where: {
        userId,
      },
      select: {
        subject: true,
        completed: true,
      },
    });
  }

  // =========================
  // NOTIFICATIONS
  // =========================

  async getNotifications(
    userId: string,
  ) {
    return prisma.notification.findMany({
      where: {
        userId,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 5,
      select: {
        id: true,
        title: true,
        message: true,
        type: true,
        time: true,
        read: true,
      },
    });
  }

  // =========================
  // FOCUS SESSION
  // =========================

  async getActiveFocusSession(
    userId: string,
  ) {
    return prisma.focusSession.findFirst({
      where: {
        userId,
        status: {
          in: ["RUNNING", "PAUSED", "IDLE"],
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
      select: {
        id: true,
        duration: true,
        remainingTime: true,
        targetHours: true,
        status: true,
        startedAt: true,
        endedAt: true,
      },
    });
  }

  // =========================
  // RECENT ACTIVITIES
  // =========================

  async getRecentActivities(
    userId: string,
  ) {
    return prisma.recentActivity.findMany({
      where: {
        userId,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 5,
      select: {
        id: true,
        icon: true,
        text: true,
        type: true,
        createdAt: true,
      },
    });
  }

  // =========================
  // ALL TASKS FOR OVERVIEW
  // =========================

  async getAllTasks(
    userId: string,
  ) {
    return prisma.task.findMany({
      where: {
        userId,
      },
      select: {
        id: true,
        dueDate: true,
        completed: true,
      },
    });
  }
}

export const dashboardRepository =
  new DashboardRepository();