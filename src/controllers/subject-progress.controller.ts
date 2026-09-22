import { Request, Response } from "express";
import { subjectProgressService } from "@/services/subject-progress.service";
import { asyncHandler } from "@/utils/helper";

export const getSubjectProgress = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    const subjects =
      await subjectProgressService.getSubjectProgress(userId);

    return res.status(200).json({
      success: true,
      data: subjects,
    });
  },
);