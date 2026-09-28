import { Router } from 'express';
import {
  createNote,
  getNotes,
  getNoteById,
  updateNote,
  deleteNote,
} from '../controllers/note.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.use(authMiddleware);

router.get('/', getNotes);
router.get('/:id', getNoteById);

router.post('/', createNote);

router.patch('/:id', updateNote);

router.delete('/:id', deleteNote);

export default router;