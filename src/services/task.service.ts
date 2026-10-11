
import { taskRepository } from "../repositories/task.repository";

import {
  CreateTaskInput,
  UpdateTaskInput,
  CalendarEvent,
  ChecklistItem,
  TaskFilters,
  RescheduleTaskInput,
  UpdateSubTaskInput,
  BulkTaskInput,
} from "../types/task.types";

// ===============================
// APP ERROR
// ===============================

class AppError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
  }
}

// ===============================
// CALCULATE SUBTASK PROGRESS
// ===============================

function calculateProgress(
  subTasks: ChecklistItem[],
): number {
  if (subTasks.length === 0) {
    return 0;
  }

  const completedCount = subTasks.filter(
    (subTask) => subTask.completed,
  ).length;

  return Math.round(
    (completedCount / subTasks.length) * 100,
  );
}

// ===============================
// FORMAT TASK AS CALENDAR EVENT
// ===============================

function formatCalendarEvent(
  task: any,
): CalendarEvent {
  const checklist: ChecklistItem[] =
    Array.isArray(task.subTasks)
      ? task.subTasks.map((subTask: any) => ({
          id: subTask.id,
          title: subTask.title,
          completed: subTask.completed,
        }))
      : [];

  const hasTime =
    typeof task.dueTime === "string" &&
    task.dueTime.trim() !== "";

  return {
    id: task.id,
    title: task.title,
    description: task.description,
    subject: task.subject,

    date: task.dueDate,

    time: hasTime ? task.dueTime : null,

    priority: task.priority,

    category: task.subject,

    isAllDay: !hasTime,

    duration: task.duration ?? 0,

    checklist,

    progress: calculateProgress(checklist),

    completed: task.completed,

    hasReminder: task.hasReminder,
  };
}

// ===============================
// VALIDATE TASK ID
// ===============================

function validateTaskId(
  taskId: string,
): void {
  if (
    !taskId ||
    typeof taskId !== "string" ||
    taskId.trim() === ""
  ) {
    throw new AppError(
      "Task ID is required.",
      400,
    );
  }
}

// ===============================
// TASK SERVICE
// ===============================

export class TaskService {
  // ===============================
  // GET ALL TASKS
  // ===============================

  async getAllTasks(
    userId: string,
    filters?: TaskFilters,
  ) {
    return await taskRepository.findAllByUser(
      userId,
      filters,
    );
  }

  // ===============================
  // GET TASKS BY FILTER
  // ===============================

  async getTasksByFilter(
    userId: string,
    filter: string,
  ) {
    const allowedFilters = [
      "all",
      "today",
      "upcoming",
      "completed",
      "pending",
      "overdue",
    ];

    const normalizedFilter =
      filter.trim().toLowerCase();

    if (
      !allowedFilters.includes(
        normalizedFilter,
      )
    ) {
      throw new AppError(
        `Invalid task filter: ${filter}`,
        400,
      );
    }

    const tasks =
      await taskRepository.findByFilter(
        userId,
        normalizedFilter,
      );

    return tasks.map(formatCalendarEvent);
  }

  // ===============================
  // GET TASKS BY DATE
  // ===============================

  async getTasksByDate(
    userId: string,
    date: string,
  ) {
    if (!date || date.trim() === "") {
      throw new AppError(
        "Date is required.",
        400,
      );
    }

    const tasks =
      await taskRepository.findByDate(
        userId,
        date,
      );

    return tasks.map(formatCalendarEvent);
  }

  // ===============================
  // GET TASK BY ID
  // ===============================

  async getTaskById(
    taskId: string,
    userId: string,
  ) {
    const normalizedTaskId =
      taskId?.trim();

    console.log(
      "========== GET TASK DEBUG ==========",
    );
    console.log(
      "Task ID:",
      normalizedTaskId,
    );
    console.log(
      "User ID:",
      userId,
    );
    console.log(
      "====================================",
    );

    if (!normalizedTaskId) {
      throw new AppError(
        "Task ID is required.",
        400,
      );
    }

    const task =
      await taskRepository.findById(
        normalizedTaskId,
        userId,
      );

    console.log(
      "Repository result:",
      task,
    );

    if (!task) {
      console.warn(
        `[TaskService] Task not found. taskId=${normalizedTaskId}, userId=${userId}`,
      );

      throw new AppError(
        "Task not found.",
        404,
      );
    }

    return task;
  }

  // ===============================
  // CREATE TASK
  // ===============================

  async createTask(
    userId: string,
    data: CreateTaskInput,
  ) {
    return await taskRepository.create(
      userId,
      data,
    );
  }

  // ===============================
  // UPDATE TASK
  // ===============================

  async updateTask(
    userId: string,
    taskId: string,
    data: UpdateTaskInput,
  ) {
    validateTaskId(taskId);

    const normalizedTaskId =
      taskId.trim();

    const existingTask =
      await taskRepository.findById(
        normalizedTaskId,
        userId,
      );

    if (!existingTask) {
      throw new AppError(
        "Task not found.",
        404,
      );
    }

    const updatedTask =
      await taskRepository.update(
        normalizedTaskId,
        userId,
        data,
      );

    if (!updatedTask) {
      throw new AppError(
        "Task not found.",
        404,
      );
    }

    return updatedTask;
  }

  // ===============================
  // DELETE TASK
  // ===============================

  async deleteTask(
    userId: string,
    taskId: string,
  ) {
    validateTaskId(taskId);

    const normalizedTaskId =
      taskId.trim();

    const existingTask =
      await taskRepository.findById(
        normalizedTaskId,
        userId,
      );

    if (!existingTask) {
      throw new AppError(
        "Task not found.",
        404,
      );
    }

    await taskRepository.delete(
      normalizedTaskId,
      userId,
    );

    return {
      message:
        "Task deleted successfully",
    };
  }

  // ===============================
  // UPCOMING DEADLINES
  // ===============================

  async getUpcomingDeadlines(
    userId: string,
  ) {
    const tasks =
      await taskRepository.findUpcomingDeadlines(
        userId,
        3,
      );

    return tasks.map(formatCalendarEvent);
  }

  // ===============================
  // RESCHEDULE TASK
  // ===============================

  async rescheduleTask(
    userId: string,
    taskId: string,
    data: RescheduleTaskInput,
  ) {
    validateTaskId(taskId);

    const normalizedTaskId =
      taskId.trim();

    const existingTask =
      await taskRepository.findById(
        normalizedTaskId,
        userId,
      );

    if (!existingTask) {
      throw new AppError(
        "Task not found.",
        404,
      );
    }

    const updatedTask =
      await taskRepository.reschedule(
        normalizedTaskId,
        userId,
        data,
      );

    if (!updatedTask) {
      throw new AppError(
        "Task not found.",
        404,
      );
    }

    return updatedTask;
  }

  // ===============================
  // UPDATE SUBTASK
  // ===============================

  async updateSubTask(
    userId: string,
    taskId: string,
    subTaskId: string,
    data: UpdateSubTaskInput,
  ) {
    validateTaskId(taskId);

    if (
      !subTaskId ||
      typeof subTaskId !== "string" ||
      subTaskId.trim() === ""
    ) {
      throw new AppError(
        "Subtask ID is required.",
        400,
      );
    }

    const normalizedTaskId =
      taskId.trim();

    const normalizedSubTaskId =
      subTaskId.trim();

    const task =
      await taskRepository.findById(
        normalizedTaskId,
        userId,
      );

    if (!task) {
      throw new AppError(
        "Task not found.",
        404,
      );
    }

    const updatedSubTask =
      await taskRepository.updateSubTask(
        userId,
        normalizedTaskId,
        normalizedSubTaskId,
        data,
      );

    if (!updatedSubTask) {
      throw new AppError(
        "Subtask not found.",
        404,
      );
    }

    const updatedTask =
      await taskRepository.findById(
        normalizedTaskId,
        userId,
      );

    if (!updatedTask) {
      throw new AppError(
        "Task not found.",
        404,
      );
    }

    return formatCalendarEvent(
      updatedTask,
    );
  }

  // ===============================
  // BULK COMPLETE TASKS
  // ===============================

  async bulkComplete(
    input: BulkTaskInput,
    userId: string,
  ) {
    const taskIds = [
      ...new Set(
        input.taskIds
          .filter(
            (id) =>
              typeof id === "string",
          )
          .map((id) => id.trim())
          .filter(Boolean),
      ),
    ];

    if (taskIds.length === 0) {
      throw new AppError(
        "At least one task must be selected.",
        400,
      );
    }

    const result =
      await taskRepository.bulkComplete(
        taskIds,
        userId,
      );

    if (result.count === 0) {
      throw new AppError(
        "No selected tasks were found.",
        404,
      );
    }

    return {
      count: result.count,
      message: `${result.count} task${
        result.count === 1 ? "" : "s"
      } completed successfully.`,
    };
  }

  // ===============================
  // BULK DELETE TASKS
  // ===============================

  async bulkDelete(
    input: BulkTaskInput,
    userId: string,
  ) {
    const taskIds = [
      ...new Set(
        input.taskIds
          .filter(
            (id) =>
              typeof id === "string",
          )
          .map((id) => id.trim())
          .filter(Boolean),
      ),
    ];

    if (taskIds.length === 0) {
      throw new AppError(
        "At least one task must be selected.",
        400,
      );
    }

    const result =
      await taskRepository.bulkDelete(
        taskIds,
        userId,
      );

    if (result.count === 0) {
      throw new AppError(
        "No selected tasks were found.",
        404,
      );
    }

    return {
      count: result.count,
      message: `${result.count} task${
        result.count === 1 ? "" : "s"
      } deleted successfully.`,
    };
  }

  // ===============================
  // GET TASK RECOMMENDATION
  // ===============================

  async getTaskRecommendation(
    userId: string,
  ) {
    const tasks =
      await taskRepository.findAllByUser(
        userId,
      );

    // ===============================
    // ONLY PENDING TASKS
    // ===============================

    const pendingTasks =
      tasks.filter(
        (task) => !task.completed,
      );

    // ===============================
    // NO PENDING TASKS
    // ===============================

    if (pendingTasks.length === 0) {
      return {
        hasRecommendation: false,
        task: null,
        message:
          "You're all caught up!",
      };
    }

    // ===============================
    // TODAY
    // ===============================

    const today =
      new Date()
        .toISOString()
        .split("T")[0];

    // ===============================
    // 1. OVERDUE TASKS
    // ===============================

    const overdueTasks =
      pendingTasks.filter(
        (task) =>
          task.dueDate &&
          task.dueDate < today,
      );

    if (overdueTasks.length > 0) {
      const task =
        [...overdueTasks].sort(
          (a, b) =>
            a.dueDate.localeCompare(
              b.dueDate,
            ),
        )[0];

      return {
        hasRecommendation: true,

        taskId: task.id,

        title: task.title,

        subject: task.subject,

        priority: task.priority,

        dueDate: task.dueDate,

        dueTime:
          task.dueTime || null,

        urgency: "CRITICAL",

        reason:
          "This task is overdue and should be completed as soon as possible.",
      };
    }

    // ===============================
    // 2. TASKS DUE TODAY
    // ===============================

    const todayTasks =
      pendingTasks.filter(
        (task) =>
          task.dueDate === today,
      );

    if (todayTasks.length > 0) {
      const priorityOrder: Record<
        string,
        number
      > = {
        High: 1,
        Medium: 2,
        Low: 3,
      };

      const task =
        [...todayTasks].sort(
          (a, b) =>
            (priorityOrder[
              a.priority
            ] ?? 99) -
            (priorityOrder[
              b.priority
            ] ?? 99),
        )[0];

      return {
        hasRecommendation: true,

        taskId: task.id,

        title: task.title,

        subject: task.subject,

        priority: task.priority,

        dueDate: task.dueDate,

        dueTime:
          task.dueTime || null,

        urgency: "HIGH",

        reason:
          "This task is due today.",
      };
    }

    // ===============================
    // 3. HIGH-PRIORITY UPCOMING TASK
    // ===============================

    const highPriorityTasks =
      pendingTasks.filter(
        (task) =>
          task.priority === "High" &&
          task.dueDate &&
          task.dueDate > today,
      );

    if (
      highPriorityTasks.length > 0
    ) {
      const task =
        [...highPriorityTasks].sort(
          (a, b) =>
            a.dueDate.localeCompare(
              b.dueDate,
            ),
        )[0];

      return {
        hasRecommendation: true,

        taskId: task.id,

        title: task.title,

        subject: task.subject,

        priority: task.priority,

        dueDate: task.dueDate,

        dueTime:
          task.dueTime || null,

        urgency: "HIGH",

        reason:
          "This is a high-priority task with an upcoming deadline.",
      };
    }

    // ===============================
    // 4. NEAREST UPCOMING TASK
    // ===============================

    const upcomingTasks =
      pendingTasks
        .filter(
          (task) =>
            task.dueDate &&
            task.dueDate >= today,
        )
        .sort((a, b) => {
          if (
            a.dueDate !==
            b.dueDate
          ) {
            return a.dueDate.localeCompare(
              b.dueDate,
            );
          }

          return (
            (a.dueTime || "").localeCompare(
              b.dueTime || "",
            )
          );
        });

    if (
      upcomingTasks.length > 0
    ) {
      const task =
        upcomingTasks[0];

      return {
        hasRecommendation: true,

        taskId: task.id,

        title: task.title,

        subject: task.subject,

        priority: task.priority,

        dueDate: task.dueDate,

        dueTime:
          task.dueTime || null,

        urgency: "MEDIUM",

        reason:
          "This task has the nearest upcoming deadline.",
      };
    }

    // ===============================
    // 5. PENDING TASK WITHOUT DEADLINE
    // ===============================

    const task =
      pendingTasks[0];

    return {
      hasRecommendation: true,

      taskId: task.id,

      title: task.title,

      subject: task.subject,

      priority: task.priority,

      dueDate: task.dueDate,

      dueTime:
        task.dueTime || null,

      urgency: "LOW",

      reason:
        "This task is still pending and has no upcoming deadline.",
    };
  }

  // ===============================
  // GET TASK ANALYTICS
  // ===============================

  async getAnalytics(
    userId: string,
  ) {
    const analytics =
      await taskRepository.getAnalytics(
        userId,
      );

    const {
      totalTasks,
      completedTasks,
      pendingTasks,
      tasks,
    } = analytics;

    // ===============================
    // COMPLETION RATE
    // ===============================

    const completionRate =
      totalTasks > 0
        ? Math.round(
            (completedTasks /
              totalTasks) *
              100,
          )
        : 0;

    // ===============================
    // CURRENT WEEK
    // ===============================

    const today = new Date();

    const startOfWeek =
      new Date(today);

    const currentDay =
      startOfWeek.getDay();

    const difference =
      currentDay === 0
        ? -6
        : 1 - currentDay;

    startOfWeek.setDate(
      startOfWeek.getDate() +
        difference,
    );

    startOfWeek.setHours(
      0,
      0,
      0,
      0,
    );

    const endOfWeek =
      new Date(startOfWeek);

    endOfWeek.setDate(
      endOfWeek.getDate() + 6,
    );

    endOfWeek.setHours(
      23,
      59,
      59,
      999,
    );

    // ===============================
    // WEEKLY COMPLETION
    // ===============================

    const weeklyCompletion = [
      {
        day: "Mon",
        count: 0,
      },
      {
        day: "Tue",
        count: 0,
      },
      {
        day: "Wed",
        count: 0,
      },
      {
        day: "Thu",
        count: 0,
      },
      {
        day: "Fri",
        count: 0,
      },
      {
        day: "Sat",
        count: 0,
      },
      {
        day: "Sun",
        count: 0,
      },
    ];

    for (const task of tasks) {
      if (
        !task.completed ||
        !task.dueDate
      ) {
        continue;
      }

      const dueDate =
        new Date(
          `${task.dueDate}T00:00:00`,
        );

      if (
        dueDate >= startOfWeek &&
        dueDate <= endOfWeek
      ) {
        const dayIndex =
          dueDate.getDay();

        const weekIndex =
          dayIndex === 0
            ? 6
            : dayIndex - 1;

        weeklyCompletion[
          weekIndex
        ].count += 1;
      }
    }

    // ===============================
    // PREVIOUS WEEK
    // ===============================

    const previousWeekStart =
      new Date(startOfWeek);

    previousWeekStart.setDate(
      previousWeekStart.getDate() -
        7,
    );

    const previousWeekEnd =
      new Date(startOfWeek);

    previousWeekEnd.setDate(
      previousWeekEnd.getDate() -
        1,
    );

    previousWeekEnd.setHours(
      23,
      59,
      59,
      999,
    );

    let previousWeekCompleted = 0;

    for (const task of tasks) {
      if (
        !task.completed ||
        !task.dueDate
      ) {
        continue;
      }

      const dueDate =
        new Date(
          `${task.dueDate}T00:00:00`,
        );

      if (
        dueDate >=
          previousWeekStart &&
        dueDate <=
          previousWeekEnd
      ) {
        previousWeekCompleted += 1;
      }
    }

    // ===============================
    // CURRENT WEEK TOTAL
    // ===============================

    const currentWeekCompleted =
      weeklyCompletion.reduce(
        (total, item) =>
          total + item.count,
        0,
      );

    // ===============================
    // WEEKLY PRODUCTIVITY
    // ===============================

    let weeklyProductivity = 0;

    if (
      previousWeekCompleted > 0
    ) {
      weeklyProductivity =
        Math.round(
          ((currentWeekCompleted -
            previousWeekCompleted) /
            previousWeekCompleted) *
            100,
        );
    } else if (
      currentWeekCompleted > 0
    ) {
      weeklyProductivity = 100;
    }

    // ===============================
    // BADGES
    // ===============================

    const badges: {
      id: string;
      title: string;
      description: string;
      icon: string;
      type: string;
    }[] = [];

    if (completedTasks >= 5) {
      badges.push({
        id: "five-tasks",
        title: "Task Crusher",
        description:
          "Completed at least 5 tasks.",
        icon: "zap",
        type: "completion",
      });
    }

    if (completedTasks >= 10) {
      badges.push({
        id: "ten-tasks",
        title: "Task Master",
        description:
          "Completed at least 10 tasks.",
        icon: "award",
        type: "completion",
      });
    }

    if (
      totalTasks > 0 &&
      pendingTasks === 0
    ) {
      badges.push({
        id: "all-complete",
        title: "All Clear",
        description:
          "Completed all your tasks.",
        icon: "check-circle",
        type: "completion",
      });
    }

    // ===============================
    // RETURN ANALYTICS
    // ===============================

    return {
      totalTasks,
      completedTasks,
      pendingTasks,
      completionRate,
      weeklyProductivity,
      weeklyCompletion,
      badges,
    };
  }
}

// ===============================
// SERVICE INSTANCE
// ===============================

export const taskService =
  new TaskService();

