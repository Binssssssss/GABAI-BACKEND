import { Router } from "express";
import { authMiddleware } from "@/middleware/auth.middleware";
import { getSubjectProgress } from "@/controllers/subject-progress.controller";

const router = Router();

router.get(
  "/",
  authMiddleware,
  getSubjectProgress,
);

export default router;