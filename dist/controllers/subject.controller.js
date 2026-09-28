import { subjectService } from '@/services/subject.service';
export class SubjectController {
    async getSubjects(req, res, next) {
        try {
            const userId = req.user.id;
            const subjects = await subjectService.getSubjects(userId);
            res.status(200).json({
                success: true,
                data: subjects,
            });
        }
        catch (error) {
            next(error);
        }
    }
    async getSubject(req, res, next) {
        try {
            const userId = req.user.id;
            const { id } = req.params;
            const subject = await subjectService.getSubject(userId, id);
            res.status(200).json({
                success: true,
                data: subject,
            });
        }
        catch (error) {
            next(error);
        }
    }
    async createSubject(req, res, next) {
        try {
            const userId = req.user.id;
            const { name } = req.body;
            const subject = await subjectService.createSubject(userId, name);
            res.status(201).json({
                success: true,
                data: subject,
            });
        }
        catch (error) {
            next(error);
        }
    }
    async updateSubject(req, res, next) {
        try {
            const userId = req.user.id;
            const { id } = req.params;
            const { name } = req.body;
            const subject = await subjectService.updateSubject(userId, id, name);
            res.status(200).json({
                success: true,
                data: subject,
            });
        }
        catch (error) {
            next(error);
        }
    }
    async deleteSubject(req, res, next) {
        try {
            const userId = req.user.id;
            const { id } = req.params;
            const result = await subjectService.deleteSubject(userId, id);
            res.status(200).json({
                success: true,
                ...result,
            });
        }
        catch (error) {
            next(error);
        }
    }
}
export const subjectController = new SubjectController();
//# sourceMappingURL=subject.controller.js.map