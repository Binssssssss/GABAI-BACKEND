import { Router } from "express";

import {
  dashboardController,
} from "../controllers/dashboard.controller";

import {
  authMiddleware,
} from "../middleware/auth.middleware";

const router = Router();

router.get(
  "/",
  authMiddleware,
  dashboardController.getDashboard.bind(
    dashboardController,
  ),
);

export default router;