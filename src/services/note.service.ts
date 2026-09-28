import * as noteRepository from '../repositories/note.repository';
import { CreateNoteInput, UpdateNoteInput } from '../types/note.types';

export const createNote = async (
  userId: string,
  data: CreateNoteInput,
) => {
  return noteRepository.createNote(userId, data);
};

export const getNotes = async (userId: string) => {
  return noteRepository.getNotes(userId);
};

export const getArchivedNotes = async (
  userId: string,
) => {
  return noteRepository.getArchivedNotes(userId);
};

export const getNoteById = async (
  userId: string,
  noteId: string,
) => {
  const note = await noteRepository.getNoteById(
    userId,
    noteId,
  );

  if (!note) {
    throw new Error('Note not found');
  }

  return note;
};

export const updateNote = async (
  userId: string,
  noteId: string,
  data: UpdateNoteInput,
) => {
  const existingNote = await noteRepository.getNoteById(
    userId,
    noteId,
  );

  if (!existingNote) {
    throw new Error('Note not found');
  }

  return noteRepository.updateNote(
    userId,
    noteId,
    data,
  );
};

export const deleteNote = async (
  userId: string,
  noteId: string,
) => {
  const existingNote = await noteRepository.getNoteById(
    userId,
    noteId,
  );

  if (!existingNote) {
    throw new Error('Note not found');
  }

  await noteRepository.deleteNote(
    userId,
    noteId,
  );

  return true;
};

export const togglePin = async (
  userId: string,
  noteId: string,
) => {
  const note = await noteRepository.getNoteById(
    userId,
    noteId,
  );

  if (!note) {
    throw new Error('Note not found');
  }

  return noteRepository.updateNote(
    userId,
    noteId,
    {
      isPinned: !note.isPinned,
    },
  );
};

export const toggleFavorite = async (
  userId: string,
  noteId: string,
) => {
  const note = await noteRepository.getNoteById(
    userId,
    noteId,
  );

  if (!note) {
    throw new Error('Note not found');
  }

  return noteRepository.updateNote(
    userId,
    noteId,
    {
      isFavorite: !note.isFavorite,
    },
  );
};

export const archiveNote = async (
  userId: string,
  noteId: string,
) => {
  const note = await noteRepository.getNoteById(
    userId,
    noteId,
  );

  if (!note) {
    throw new Error('Note not found');
  }

  return noteRepository.updateNote(
    userId,
    noteId,
    {
      isArchived: true,
    },
  );
};

export const unarchiveNote = async (
  userId: string,
  noteId: string,
) => {
  const note = await noteRepository.getNoteById(
    userId,
    noteId,
  );

  if (!note) {
    throw new Error('Note not found');
  }

  return noteRepository.updateNote(
    userId,
    noteId,
    {
      isArchived: false,
    },
  );
};