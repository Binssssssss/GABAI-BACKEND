import { Router } from "express";
import { authMiddleware } from "@/middleware/auth.middleware";

import {
  getRecentActivities,
  createRecentActivity,
  deleteRecentActivity,
} from "@/controllers/recent-activity.controller";

const router = Router();

router.get("/", authMiddleware, getRecentActivities);

router.post("/", authMiddleware, createRecentActivity);

router.delete("/:id", authMiddleware, deleteRecentActivity);

export default router;