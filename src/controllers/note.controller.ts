import { Request, Response } from 'express';

import * as noteRepository from '../repositories/note.repository';

import { NoteFilters } from '../types/note.types';

/**
 * Create Note
 */
export const createNote = async (
  req: Request,
  res: Response,
) => {
  try {
    const userId = req.user!.id;

    const note = await noteRepository.createNote(
      userId,
      req.body,
    );

    return res.status(201).json({
      success: true,
      message: 'Note created successfully',
      data: note,
    });
  } catch (error) {
    console.error('Create note error:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to create note',
    });
  }
};

/**
 * Get Notes
 *
 * Supports:
 * ?tab=all
 * ?tab=pinned
 * ?tab=favorites
 * ?tab=archived
 * ?category=School
 * ?tag=exam
 * ?search=math
 * ?sortBy=updated
 * ?sortOrder=desc
 */
export const getNotes = async (
  req: Request,
  res: Response,
) => {
  try {
    const userId = req.user!.id;

    const tab =
      typeof req.query.tab === 'string'
        ? req.query.tab
        : undefined;

    const category =
      typeof req.query.category === 'string'
        ? req.query.category
        : undefined;

    const tag =
      typeof req.query.tag === 'string'
        ? req.query.tag
        : undefined;

    const search =
      typeof req.query.search === 'string'
        ? req.query.search
        : undefined;

    const sortBy =
      typeof req.query.sortBy === 'string'
        ? req.query.sortBy
        : undefined;

    const sortOrder =
      req.query.sortOrder === 'asc' ||
      req.query.sortOrder === 'desc'
        ? req.query.sortOrder
        : undefined;

    const filters: NoteFilters = {
      tab: tab as NoteFilters['tab'],
      category,
      tag,
      search,
      sortBy: sortBy as NoteFilters['sortBy'],
      sortOrder,
    };

    const result = await noteRepository.getNotes(
      userId,
      filters,
    );

    return res.status(200).json({
      success: true,
      data: result.notes,
      total: result.total,
    });
  } catch (error) {
    console.error('Get notes error:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to fetch notes',
    });
  }
};

/**
 * Get Archived Notes
 */
export const getArchivedNotes = async (
  req: Request,
  res: Response,
) => {
  try {
    const userId = req.user!.id;

    const notes =
      await noteRepository.getArchivedNotes(userId);

    return res.status(200).json({
      success: true,
      data: notes,
      total: notes.length,
    });
  } catch (error) {
    console.error(
      'Get archived notes error:',
      error,
    );

    return res.status(500).json({
      success: false,
      message: 'Failed to fetch archived notes',
    });
  }
};

/**
 * Get Note By ID
 */
export const getNoteById = async (
  req: Request,
  res: Response,
) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const note =
      await noteRepository.getNoteById(
        userId,
        String(id),
      );

    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'Note not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: note,
    });
  } catch (error) {
    console.error('Get note error:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to fetch note',
    });
  }
};

/**
 * Update Note
 *
 * Supports:
 * title
 * content
 * category
 * tags
 * type
 * isPinned
 * isFavorite
 * isArchived
 */
export const updateNote = async (
  req: Request,
  res: Response,
) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const note =
      await noteRepository.updateNote(
        userId,
        String(id),
        req.body,
      );

    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'Note not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Note updated successfully',
      data: note,
    });
  } catch (error) {
    console.error('Update note error:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to update note',
    });
  }
};

/**
 * Delete Note
 */
export const deleteNote = async (
  req: Request,
  res: Response,
) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const deleted =
      await noteRepository.deleteNote(
        userId,
        String(id),
      );

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Note not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Note deleted successfully',
    });
  } catch (error) {
    console.error('Delete note error:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to delete note',
    });
  }
};

/**
 * Toggle Pin / Unpin
 */
export const togglePin = async (
  req: Request,
  res: Response,
) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const note =
      await noteRepository.getNoteById(
        userId,
        String(id),
      );

    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'Note not found',
      });
    }

    const updatedNote =
      await noteRepository.updateNote(
        userId,
        String(id),
        {
          isPinned: !note.isPinned,
        },
      );

    return res.status(200).json({
      success: true,
      message: updatedNote?.isPinned
        ? 'Note pinned successfully'
        : 'Note unpinned successfully',
      data: updatedNote,
    });
  } catch (error) {
    console.error('Toggle pin error:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to update pin status',
    });
  }
};

/**
 * Toggle Favorite / Unfavorite
 */
export const toggleFavorite = async (
  req: Request,
  res: Response,
) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const note =
      await noteRepository.getNoteById(
        userId,
        String(id),
      );

    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'Note not found',
      });
    }

    const updatedNote =
      await noteRepository.updateNote(
        userId,
        String(id),
        {
          isFavorite: !note.isFavorite,
        },
      );

    return res.status(200).json({
      success: true,
      message: updatedNote?.isFavorite
        ? 'Note added to favorites'
        : 'Note removed from favorites',
      data: updatedNote,
    });
  } catch (error) {
    console.error(
      'Toggle favorite error:',
      error,
    );

    return res.status(500).json({
      success: false,
      message:
        'Failed to update favorite status',
    });
  }
};

/**
 * Archive Note
 */
export const archiveNote = async (
  req: Request,
  res: Response,
) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const note =
      await noteRepository.updateNote(
        userId,
        String(id),
        {
          isArchived: true,
        },
      );

    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'Note not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Note archived successfully',
      data: note,
    });
  } catch (error) {
    console.error(
      'Archive note error:',
      error,
    );

    return res.status(500).json({
      success: false,
      message: 'Failed to archive note',
    });
  }
};

/**
 * Unarchive Note
 */
export const unarchiveNote = async (
  req: Request,
  res: Response,
) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const note =
      await noteRepository.updateNote(
        userId,
        String(id),
        {
          isArchived: false,
        },
      );

    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'Note not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Note unarchived successfully',
      data: note,
    });
  } catch (error) {
    console.error(
      'Unarchive note error:',
      error,
    );

    return res.status(500).json({
      success: false,
      message: 'Failed to unarchive note',
    });
  }
};