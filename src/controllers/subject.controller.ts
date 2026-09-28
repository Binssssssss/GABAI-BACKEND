import { Request, Response, NextFunction } from 'express';
import { subjectService } from '@/services/subject.service';

export class SubjectController {
  async getSubjects(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const userId = req.user.id;

      const subjects = await subjectService.getSubjects(userId);

      res.status(200).json({
        success: true,
        data: subjects,
      });
    } catch (error) {
      next(error);
    }
  }

  async getSubject(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const userId = req.user.id;
      const { id } = req.params as { id: string };

      const subject = await subjectService.getSubject(
        userId,
        id,
      );

      res.status(200).json({
        success: true,
        data: subject,
      });
    } catch (error) {
      next(error);
    }
  }

  async createSubject(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const userId = req.user.id;
      const { name } = req.body;

      const subject = await subjectService.createSubject(
        userId,
        name,
      );

      res.status(201).json({
        success: true,
        data: subject,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateSubject(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const userId = req.user.id;
      const { id } = req.params as { id: string };
      const { name } = req.body;

      const subject = await subjectService.updateSubject(
        userId,
        id,
        name,
      );

      res.status(200).json({
        success: true,
        data: subject,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteSubject(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const userId = req.user.id;
      const { id } = req.params as { id: string };

      const result = await subjectService.deleteSubject(
        userId,
        id,
      );

      res.status(200).json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const subjectController = new SubjectController();