import * as noteRepository from '../repositories/note.repository.js';
export const createNote = async (userId, data) => {
    return noteRepository.createNote(userId, data);
};
export const getNotes = async (userId, filters) => {
    return noteRepository.getNotes(userId, filters);
};
export const getArchivedNotes = async (userId) => {
    return noteRepository.getArchivedNotes(userId);
};
export const getNoteById = async (userId, noteId) => {
    const note = await noteRepository.getNoteById(userId, noteId);
    if (!note) {
        throw new Error('Note not found');
    }
    return note;
};
export const updateNote = async (userId, noteId, data) => {
    const existingNote = await noteRepository.getNoteById(userId, noteId);
    if (!existingNote) {
        throw new Error('Note not found');
    }
    return noteRepository.updateNote(userId, noteId, data);
};
export const deleteNote = async (userId, noteId) => {
    const existingNote = await noteRepository.getNoteById(userId, noteId);
    if (!existingNote) {
        throw new Error('Note not found');
    }
    await noteRepository.deleteNote(userId, noteId);
    return true;
};
export const togglePin = async (userId, noteId) => {
    const note = await noteRepository.getNoteById(userId, noteId);
    if (!note) {
        throw new Error('Note not found');
    }
    return noteRepository.updateNote(userId, noteId, {
        isPinned: !note.isPinned,
    });
};
export const toggleFavorite = async (userId, noteId) => {
    const note = await noteRepository.getNoteById(userId, noteId);
    if (!note) {
        throw new Error('Note not found');
    }
    return noteRepository.updateNote(userId, noteId, {
        isFavorite: !note.isFavorite,
    });
};
export const archiveNote = async (userId, noteId) => {
    const note = await noteRepository.getNoteById(userId, noteId);
    if (!note) {
        throw new Error('Note not found');
    }
    return noteRepository.updateNote(userId, noteId, {
        isArchived: true,
    });
};
export const unarchiveNote = async (userId, noteId) => {
    const note = await noteRepository.getNoteById(userId, noteId);
    if (!note) {
        throw new Error('Note not found');
    }
    return noteRepository.updateNote(userId, noteId, {
        isArchived: false,
    });
};
//# sourceMappingURL=note.service.js.map