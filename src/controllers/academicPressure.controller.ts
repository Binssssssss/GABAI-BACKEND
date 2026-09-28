import { Request, Response } from "express";
import { prisma } from "../lib/prisma";

export const getAcademicPressure = async (
  req: Request,
  res: Response
) => {
  try {
    const userId = req.user.userId;
    const today = new Date();

   const tasks = await prisma.task.findMany({
  where: {
    userId,
  },
});

    const totalTasks = tasks.length;

    const pendingTasks = tasks.filter((task) => !task.completed);

    const overdueTasks = pendingTasks.filter(
      (task) => new Date(task.dueDate) < today
    );

    const urgentTasks = pendingTasks.filter((task) => {
      const due = new Date(task.dueDate);
      const daysLeft = Math.ceil(
        (due.getTime() - today.getTime()) /
          (1000 * 60 * 60 * 24)
      );

      return daysLeft >= 0 && daysLeft <= 3;
    });

    // Calculate pressure score
    let score = 0;

    score += pendingTasks.length * 5;
    score += overdueTasks.length * 15;
    score += urgentTasks.length * 10;

    score = Math.min(score, 100);

    let level: "LOW" | "MEDIUM" | "HIGH" = "LOW";
    let label = "Low Pressure";

    if (score >= 70) {
      level = "HIGH";
      label = "High Pressure";
    } else if (score >= 40) {
      level = "MEDIUM";
      label = "Moderate Pressure";
    }

    return res.status(200).json({
      success: true,
      data: {
        level,
        label,
        score,
        totalTasks,
        pendingTasks: pendingTasks.length,
        overdueTasks: overdueTasks.length,
        urgentTasks: urgentTasks.length,
      },
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch academic pressure.",
    });
  }
};