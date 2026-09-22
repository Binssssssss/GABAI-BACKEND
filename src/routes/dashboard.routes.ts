import { Router } from "express";
import { authMiddleware } from "@/middleware/auth.middleware";
import { getOverview } from "@/controllers/dashboard.controller";

const router = Router();

router.get(
  "/overview",
  authMiddleware,
  getOverview,
);

export default router;