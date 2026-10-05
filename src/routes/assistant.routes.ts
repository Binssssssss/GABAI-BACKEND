import { Router } from 'express';
import { assistantController } from '../controllers/assistant.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.post(
  '/chat',
  authMiddleware,
  assistantController.chat.bind(assistantController),
);

router.post(
  '/reset',
  authMiddleware,
  assistantController.reset.bind(assistantController),
);

export default router;