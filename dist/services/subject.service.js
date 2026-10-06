import { subjectRepository } from '../repositories/subject.repository.js';
import { AppError } from '../utils/response.js';
export class SubjectService {
    async getSubjects(userId) {
        return subjectRepository.findAllByUser(userId);
    }
    async getSubject(userId, subjectId) {
        const subject = await subjectRepository.findById(userId, subjectId);
        if (!subject) {
            throw new AppError('Subject not found', 404);
        }
        return subject;
    }
    async createSubject(userId, name) {
        const trimmedName = name.trim();
        if (!trimmedName) {
            throw new AppError('Subject name is required', 400);
        }
        const existingSubjects = await subjectRepository.findAllByUser(userId);
        const alreadyExists = existingSubjects.some((subject) => subject.name.toLowerCase() === trimmedName.toLowerCase());
        if (alreadyExists) {
            throw new AppError('Subject already exists', 409);
        }
        return subjectRepository.create(userId, trimmedName);
    }
    async updateSubject(userId, subjectId, name) {
        const trimmedName = name.trim();
        if (!trimmedName) {
            throw new AppError('Subject name is required', 400);
        }
        const subject = await subjectRepository.findById(userId, subjectId);
        if (!subject) {
            throw new AppError('Subject not found', 404);
        }
        const existingSubjects = await subjectRepository.findAllByUser(userId);
        const duplicate = existingSubjects.some((existingSubject) => existingSubject.id !== subjectId &&
            existingSubject.name.toLowerCase() ===
                trimmedName.toLowerCase());
        if (duplicate) {
            throw new AppError('Subject already exists', 409);
        }
        await subjectRepository.update(userId, subjectId, trimmedName);
        return subjectRepository.findById(userId, subjectId);
    }
    async deleteSubject(userId, subjectId) {
        const subject = await subjectRepository.findById(userId, subjectId);
        if (!subject) {
            throw new AppError('Subject not found', 404);
        }
        await subjectRepository.delete(userId, subjectId);
        return {
            message: 'Subject deleted successfully',
        };
    }
}
export const subjectService = new SubjectService();
//# sourceMappingURL=subject.service.js.map