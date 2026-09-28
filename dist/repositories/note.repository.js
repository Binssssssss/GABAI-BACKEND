import { prisma } from '../config/prisma';
export const createNote = async (userId, data) => {
    return prisma.note.create({
        data: {
            title: data.title ?? 'Untitled Note',
            content: data.content ?? '',
            type: data.type ?? 'BLANK',
            category: data.category ?? 'General',
            tags: data.tags ?? [],
            userId,
        },
    });
};
export const getNotes = async (userId) => {
    const notes = await prisma.note.findMany({
        where: {
            userId,
            isArchived: false,
        },
        orderBy: {
            updatedAt: 'desc',
        },
    });
    const total = await prisma.note.count({
        where: {
            userId,
            isArchived: false,
        },
    });
    return {
        notes,
        total,
    };
};
export const getArchivedNotes = async (userId) => {
    return prisma.note.findMany({
        where: {
            userId,
            isArchived: true,
        },
        orderBy: {
            updatedAt: 'desc',
        },
    });
};
export const getNoteById = async (userId, noteId) => {
    return prisma.note.findFirst({
        where: {
            id: noteId,
            userId,
        },
    });
};
export const updateNote = async (userId, noteId, data) => {
    const result = await prisma.note.updateMany({
        where: {
            id: noteId,
            userId,
        },
        data,
    });
    if (result.count === 0) {
        return null;
    }
    return prisma.note.findFirst({
        where: {
            id: noteId,
            userId,
        },
    });
};
export const deleteNote = async (userId, noteId) => {
    const result = await prisma.note.deleteMany({
        where: {
            id: noteId,
            userId,
        },
    });
    return result.count > 0;
};
//# sourceMappingURL=note.repository.js.map