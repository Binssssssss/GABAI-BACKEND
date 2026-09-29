import { Router } from 'express';

import {
  createNote,
  getNotes,
  getArchivedNotes,
  getNoteById,
  updateNote,
  deleteNote,
  togglePin,
  toggleFavorite,
  archiveNote,
  unarchiveNote,
} from '../controllers/note.controller';

import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.use(authMiddleware);

// Get active notes
router.get('/', getNotes);

// Get archived notes
router.get('/archived', getArchivedNotes);

// Get single note
router.get('/:id', getNoteById);

// Create note
router.post('/', createNote);

// Update note
router.patch('/:id', updateNote);

// Pin / Unpin
router.patch('/:id/pin', togglePin);

// Favorite / Unfavorite
router.patch('/:id/favorite', toggleFavorite);

// Archive
router.patch('/:id/archive', archiveNote);

// Unarchive
router.patch('/:id/unarchive', unarchiveNote);

// Delete
router.delete('/:id', deleteNote);

export default router;