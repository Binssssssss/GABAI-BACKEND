import { prisma } from '../config/prisma.js';
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
export const getNotes = async (userId, filters) => {
    const where = {
        userId,
    };
    // Filter by tab
    if (filters?.tab === 'pinned') {
        where.isPinned = true;
        where.isArchived = false;
    }
    if (filters?.tab === 'favorites') {
        where.isFavorite = true;
        where.isArchived = false;
    }
    if (filters?.tab === 'archived') {
        where.isArchived = true;
    }
    if (filters?.tab === 'all') {
        where.isArchived = false;
    }
    // Filter by category
    if (filters?.category &&
        filters.category !== 'All') {
        where.category = filters.category;
    }
    // Filter by tag
    if (filters?.tag) {
        where.tags = {
            has: filters.tag,
        };
    }
    // Search title/content/category
    if (filters?.search) {
        where.OR = [
            {
                title: {
                    contains: filters.search,
                    mode: 'insensitive',
                },
            },
            {
                content: {
                    contains: filters.search,
                    mode: 'insensitive',
                },
            },
            {
                category: {
                    contains: filters.search,
                    mode: 'insensitive',
                },
            },
        ];
    }
    // Sorting
    let orderBy = {
        updatedAt: 'desc',
    };
    switch (filters?.sortBy) {
        case 'created':
            orderBy = {
                createdAt: filters.sortOrder ?? 'desc',
            };
            break;
        case 'title':
            orderBy = {
                title: filters.sortOrder ?? 'asc',
            };
            break;
        case 'category':
            orderBy = {
                category: filters.sortOrder ?? 'asc',
            };
            break;
        case 'updated':
        default:
            orderBy = {
                updatedAt: filters?.sortOrder ?? 'desc',
            };
            break;
    }
    const notes = await prisma.note.findMany({
        where,
        orderBy,
    });
    const total = await prisma.note.count({
        where,
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