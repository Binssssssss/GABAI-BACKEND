import { academicPressureService } from "../services/academic-pressure.service";
export class AcademicPressureController {
    async getAcademicPressure(req, res, next) {
        try {
            const userId = req.user?.id;
            if (typeof userId !== "string" || !userId) {
                return res.status(401).json({
                    success: false,
                    message: "Authentication required",
                });
            }
            const pressure = await academicPressureService.calculatePressure(userId);
            return res.status(200).json({
                success: true,
                message: "Academic pressure calculated successfully",
                data: pressure,
            });
        }
        catch (error) {
            next(error);
        }
    }
}
export const academicPressureController = new AcademicPressureController();
//# sourceMappingURL=academic-pressure.controller.js.map