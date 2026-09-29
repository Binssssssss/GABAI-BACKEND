import { Request, Response } from "express";
import { smartReminderService } from "@/services/smart-reminder.service";
import { asyncHandler } from "@/utils/helper";

export const getSmartReminder = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    const reminder =
      await smartReminderService.getSmartReminder(userId);

    return res.status(200).json({
      success: true,
      data: reminder,
    });
  },
);