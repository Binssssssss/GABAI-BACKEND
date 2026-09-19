import { taskRepository } from "@/repositories/task.repository";
import {
  CreateTaskInput,
  UpdateTaskInput,
} from "@/types/task.types";
import { AppError } from "@/utils/response";

export class TaskService {
  async getTasks(userId: string) {
    return taskRepository.findAllByUser(userId);
  }

  async getTaskById(id: string, userId: string) {
    const task = await taskRepository.findById(id, userId);

    if (!task) {
      throw new AppError("Task not found", 404);
    }

    return task;
  }

  async createTask(userId: string, input: CreateTaskInput) {
    return taskRepository.create(userId, input);
  }

  async updateTask(
    id: string,
    userId: string,
    input: UpdateTaskInput
  ) {
    const task = await taskRepository.update(id, userId, input);

    if (!task) {
      throw new AppError("Task not found", 404);
    }

    return task;
  }

  async deleteTask(id: string, userId: string) {
    const task = await taskRepository.delete(id, userId);

    if (!task) {
      throw new AppError("Task not found", 404);
    }

    return task;
  }
}

export const taskService = new TaskService();