import { Request, Response } from 'express';
import * as noteRepository from '../repositories/note.repository';

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

export const getNotes = async (
  req: Request,
  res: Response,
) => {
  try {
    const userId = req.user!.id;

    const result = await noteRepository.getNotes(userId);

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

export const getArchivedNotes = async (
  req: Request,
  res: Response,
) => {
  try {
    const userId = req.user!.id;

    const notes = await noteRepository.getArchivedNotes(userId);

    return res.status(200).json({
      success: true,
      data: notes,
      total: notes.length,
    });
  } catch (error) {
    console.error('Get archived notes error:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to fetch archived notes',
    });
  }
};

export const getNoteById = async (
  req: Request,
  res: Response,
) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const note = await noteRepository.getNoteById(
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

export const updateNote = async (
  req: Request,
  res: Response,
) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const note = await noteRepository.updateNote(
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

export const deleteNote = async (
  req: Request,
  res: Response,
) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const deleted = await noteRepository.deleteNote(
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