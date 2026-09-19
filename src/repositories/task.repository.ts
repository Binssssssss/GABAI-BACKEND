import { prisma } from "@/lib/prisma";
import { CreateTaskInput, UpdateTaskInput } from "@/types/task.types";

export class TaskRepository {
  async findAllByUser(userId: string) {
    return prisma.task.findMany({
      where: {
        userId,
      },
      include: {
        subTasks: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  async findById(id: string, userId: string) {
    return prisma.task.findFirst({
      where: {
        id,
        userId,
      },
      include: {
        subTasks: true,
      },
    });
  }

 async create(userId: string, data: CreateTaskInput) {
  return prisma.task.create({
    data: {
      title: data.title,
      description: data.description ?? "",
      subject: data.subject,
      priority: data.priority,
      dueDate: data.dueDate,
      dueTime: data.dueTime,
      hasReminder: data.hasReminder ?? false,
      userId,

      subTasks: {
        create: (data.subTasks ?? []).map((title) => ({
          title,
        })),
      },
    },
    include: {
      subTasks: true,
    },
  });
}

  async update(id: string, userId: string, data: UpdateTaskInput) {
    const existingTask = await this.findById(id, userId);

    if (!existingTask) {
      return null;
    }

    const { subTasks, ...taskData } = data;

    return prisma.$transaction(async (tx) => {
      await tx.task.update({
        where: {
          id,
        },
        data: taskData,
      });

      if (subTasks !== undefined) {
        await tx.subTask.deleteMany({
          where: {
            taskId: id,
          },
        });

        if (subTasks.length > 0) {
          await tx.subTask.createMany({
            data: subTasks.map((title) => ({
              title,
              taskId: id,
            })),
          });
        }
      }

      return tx.task.findUnique({
        where: {
          id,
        },
        include: {
          subTasks: true,
        },
      });
    });
  }

  async delete(id: string, userId: string) {
    const existingTask = await this.findById(id, userId);

    if (!existingTask) {
      return null;
    }

    return prisma.task.delete({
      where: {
        id,
      },
    });
  }
}

export const taskRepository = new TaskRepository();