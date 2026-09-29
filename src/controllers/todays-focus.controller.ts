import { Request, Response } from "express";
import { todaysFocusService } from "@/services/todays-focus.service";
import { asyncHandler } from "@/utils/helper";

export const getTodaysFocus = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    const tasks =
      await todaysFocusService.getTodaysFocus(userId);

    return res.status(200).json({
      success: true,
      data: tasks,
    });
  },
);