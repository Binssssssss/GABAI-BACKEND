import * as noteRepository from '../repositories/note.repository';
export const createNote = async (req, res) => {
    try {
        const userId = req.user.id;
        const note = await noteRepository.createNote(userId, req.body);
        return res.status(201).json({
            success: true,
            message: 'Note created successfully',
            data: note,
        });
    }
    catch (error) {
        console.error('Create note error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to create note',
        });
    }
};
export const getNotes = async (req, res) => {
    try {
        const userId = req.user.id;
        const tab = typeof req.query.tab === 'string'
            ? req.query.tab
            : undefined;
        const category = typeof req.query.category === 'string'
            ? req.query.category
            : undefined;
        const tag = typeof req.query.tag === 'string'
            ? req.query.tag
            : undefined;
        const search = typeof req.query.search === 'string'
            ? req.query.search
            : undefined;
        const sortBy = typeof req.query.sortBy === 'string'
            ? req.query.sortBy
            : undefined;
        const sortOrder = req.query.sortOrder === 'asc' ||
            req.query.sortOrder === 'desc'
            ? req.query.sortOrder
            : undefined;
        const result = await noteRepository.getNotes(userId, {
            tab: tab,
            category,
            tag,
            search,
            sortBy: sortBy,
            sortOrder,
        });
        return res.status(200).json({
            success: true,
            data: result.notes,
            total: result.total,
        });
    }
    catch (error) {
        console.error('Get notes error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch notes',
        });
    }
};
export const getArchivedNotes = async (req, res) => {
    try {
        const userId = req.user.id;
        const notes = await noteRepository.getArchivedNotes(userId);
        return res.status(200).json({
            success: true,
            data: notes,
            total: notes.length,
        });
    }
    catch (error) {
        console.error('Get archived notes error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch archived notes',
        });
    }
};
export const getNoteById = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        const note = await noteRepository.getNoteById(userId, String(id));
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
    }
    catch (error) {
        console.error('Get note error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch note',
        });
    }
};
export const updateNote = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        const note = await noteRepository.updateNote(userId, String(id), req.body);
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
    }
    catch (error) {
        console.error('Update note error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to update note',
        });
    }
};
export const deleteNote = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        const deleted = await noteRepository.deleteNote(userId, String(id));
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
    }
    catch (error) {
        console.error('Delete note error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to delete note',
        });
    }
};
export const togglePin = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        const note = await noteRepository.getNoteById(userId, String(id));
        if (!note) {
            return res.status(404).json({
                success: false,
                message: 'Note not found',
            });
        }
        const updatedNote = await noteRepository.updateNote(userId, String(id), {
            isPinned: !note.isPinned,
        });
        return res.status(200).json({
            success: true,
            message: updatedNote?.isPinned
                ? 'Note pinned successfully'
                : 'Note unpinned successfully',
            data: updatedNote,
        });
    }
    catch (error) {
        console.error('Toggle pin error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to update pin status',
        });
    }
};
export const toggleFavorite = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        const note = await noteRepository.getNoteById(userId, String(id));
        if (!note) {
            return res.status(404).json({
                success: false,
                message: 'Note not found',
            });
        }
        const updatedNote = await noteRepository.updateNote(userId, String(id), {
            isFavorite: !note.isFavorite,
        });
        return res.status(200).json({
            success: true,
            message: updatedNote?.isFavorite
                ? 'Note added to favorites'
                : 'Note removed from favorites',
            data: updatedNote,
        });
    }
    catch (error) {
        console.error('Toggle favorite error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to update favorite status',
        });
    }
};
export const archiveNote = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        const note = await noteRepository.updateNote(userId, String(id), {
            isArchived: true,
        });
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
    }
    catch (error) {
        console.error('Archive note error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to archive note',
        });
    }
};
export const unarchiveNote = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        const note = await noteRepository.updateNote(userId, String(id), {
            isArchived: false,
        });
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
    }
    catch (error) {
        console.error('Unarchive note error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to unarchive note',
        });
    }
};
//# sourceMappingURL=note.controller.js.map