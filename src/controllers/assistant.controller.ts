import { Request, Response, NextFunction } from 'express';
import { assistantService } from '../services/assistant.service';

export class AssistantController {
  async chat(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
        return;
      }

      const result = await assistantService.chat(userId, req.body);

      res.status(200).json({
        success: true,
        message: 'Assistant response generated successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async reset(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
        return;
      }

      const result = await assistantService.reset();

      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const assistantController = new AssistantController();