import {
  Request,
  Response,
  NextFunction,
} from "express";

import {
  dashboardService,
} from "../services/dashboard.service";

import {
  sendSuccess,
  sendError,
} from "../utils/response";

export class DashboardController {

  async getDashboard(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {

    try {

      const userId =
        req.user?.id;

      if (!userId) {
        return sendError(
          res,
          "Authentication required",
          401,
        );
      }

      const dashboard =
        await dashboardService.getDashboard(
          userId,
        );

      return sendSuccess(
        res,
        "Dashboard data retrieved successfully",
        dashboard,
      );

    } catch (error) {

      next(error);

    }
  }
}

export const dashboardController =
  new DashboardController();