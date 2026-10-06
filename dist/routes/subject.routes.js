import { Router } from 'express';
import { subjectController } from '../controllers/subject.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
const router = Router();
router.use(authMiddleware);
router.get('/', subjectController.getSubjects.bind(subjectController));
router.get('/:id', subjectController.getSubject.bind(subjectController));
router.post('/', subjectController.createSubject.bind(subjectController));
router.put('/:id', subjectController.updateSubject.bind(subjectController));
router.delete('/:id', subjectController.deleteSubject.bind(subjectController));
export default router;
//# sourceMappingURL=subject.routes.js.map