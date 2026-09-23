import {taskRepository} from "../repositories/task.repository";
import {
  CreateTaskInput,
  UpdateTaskInput,
  CalendarEvent,
  ChecklistItem,
  TaskFilters,
  RescheduleTaskInput,
  UpdateSubTaskInput,
} from "../types/task.types";

function calculateProgress(
  subTasks: ChecklistItem[],
): number {
  if (subTasks.length === 0) {
    return 0;
  }

  const completedCount =
    subTasks.filter(
      (subTask) => subTask.completed,
    ).length;

  return Math.round(
    (completedCount / subTasks.length) * 100,
  );
}

function formatCalendarEvent(
  task: any,
): CalendarEvent {
  const checklist: ChecklistItem[] =
    task.subTasks.map((subTask: any) => ({
      id: subTask.id,
      title: subTask.title,
      completed: subTask.completed,
    }));

  return {
    id: task.id,
    title: task.title,
    description: task.description,
    subject: task.subject,

    date: task.dueDate,

    time:
      task.dueTime &&
      task.dueTime.trim() !== ""
        ? task.dueTime
        : null,

    priority: task.priority,

    category: task.subject,

    isAllDay:
      !task.dueTime ||
      task.dueTime.trim() === "",

    duration: null,

    checklist,

    progress: calculateProgress(
      checklist,
    ),

    completed: task.completed,

    hasReminder: task.hasReminder,
  };
}

export class TaskService {
  async getAllTasks(
    userId: string,
    filters?: TaskFilters,
  ) {
    const tasks =
      await taskRepository.findAllByUser(
        userId,
        filters,
      );

    return tasks.map(
      formatCalendarEvent,
    );
  }

  async getTasksByDate(
    userId: string,
    date: string,
  ) {
    const tasks =
      await taskRepository.findByDate(
        userId,
        date,
      );

    return tasks.map(
      formatCalendarEvent,
    );
  }

  async getTaskById(
    userId: string,
    taskId: string,
  ) {
    const task =
      await taskRepository.findById(
        taskId,
        userId,
      );

    if (!task) {
      throw new Error(
        "Task not found",
      );
    }

    return formatCalendarEvent(task);
  }

  async createTask(
    userId: string,
    data: CreateTaskInput,
  ) {
    const task =
      await taskRepository.create(
        userId,
        data,
      );

    return formatCalendarEvent(task);
  }

  async updateTask(
    userId: string,
    taskId: string,
    data: UpdateTaskInput,
  ) {
    const existingTask =
      await taskRepository.findById(
        taskId,
        userId,
      );

    if (!existingTask) {
      throw new Error(
        "Task not found",
      );
    }

    const updatedTask =
      await taskRepository.update(
        taskId,
        userId,
        data,
      );

    return formatCalendarEvent(
      updatedTask,
    );
  }

  async deleteTask(
    userId: string,
    taskId: string,
  ) {
    const existingTask =
      await taskRepository.findById(
        taskId,
        userId,
      );

    if (!existingTask) {
      throw new Error(
        "Task not found",
      );
    }

    await taskRepository.delete(
      taskId,
      userId,
    );

    return {
      message:
        "Task deleted successfully",
    };
  }

 async getUpcomingDeadlines(userId: string) {
  const tasks =
    await taskRepository.findUpcomingDeadlines(
      userId,
      3,
    );

  return tasks.map(formatCalendarEvent);
}
async rescheduleTask(
  userId: string,
  taskId: string,
  data: RescheduleTaskInput,
) {
  const existingTask =
    await taskRepository.findById(
      taskId,
      userId,
    );

  if (!existingTask) {
    throw new Error("Task not found");
  }

  const updatedTask =
    await taskRepository.reschedule(
      taskId,
      userId,
      data,
    );

  return formatCalendarEvent(updatedTask);
}
async updateSubTask(
  userId: string,
  taskId: string,
  subTaskId: string,
  data: UpdateSubTaskInput,
) {
  const task = await taskRepository.findById(
    taskId,
    userId,
  );

  if (!task) {
    throw new Error("Task not found");
  }

  const updatedSubTask =
    await taskRepository.updateSubTask(
      userId,
      taskId,
      subTaskId,
      data,
    );

  if (!updatedSubTask) {
    throw new Error("Subtask not found");
  }

  const updatedTask =
    await taskRepository.findById(
      taskId,
      userId,
    );

  if (!updatedTask) {
    throw new Error("Task not found");
  }

  return formatCalendarEvent(updatedTask);
}
}
export const taskService =
  new TaskService();

