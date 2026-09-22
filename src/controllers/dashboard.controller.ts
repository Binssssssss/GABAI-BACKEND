import { Request, Response } from "express";
import { dashboardService } from "@/services/dashboard.service";
import { asyncHandler } from "@/utils/helper";

export const getOverview = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    const overview =
      await dashboardService.getOverview(userId);

    return res.status(200).json({
      success: true,
      data: overview,
    });
  },
);