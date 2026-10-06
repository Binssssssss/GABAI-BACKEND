import { Router } from 'express';
import { assistantController } from '../controllers/assistant.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
const router = Router();
router.post('/chat', authMiddleware, assistantController.chat.bind(assistantController));
router.post('/reset', authMiddleware, assistantController.reset.bind(assistantController));
export default router;
//# sourceMappingURL=assistant.routes.js.map