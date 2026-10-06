import { subjectProgressService } from "../services/subject-progress.service.js";
import { asyncHandler } from "../utils/helper.js";
export const getSubjectProgress = asyncHandler(async (req, res) => {
    const userId = req.user?.id;
    if (!userId) {
        return res.status(401).json({
            success: false,
            message: "Authentication required.",
        });
    }
    const subjects = await subjectProgressService.getSubjectProgress(userId);
    return res.status(200).json({
        success: true,
        data: subjects,
    });
});
//# sourceMappingURL=subject-progress.controller.js.map