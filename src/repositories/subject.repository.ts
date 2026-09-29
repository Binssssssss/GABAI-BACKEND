import { randomUUID } from 'node:crypto';
import { prisma } from '@/lib/prisma';

export const subjectRepository = {
  /**
   * Get all subjects belonging to a specific user.
   */
  findAllByUser(userId: string) {
    return prisma.subjects.findMany({
      where: {
        userId,
      },
      orderBy: {
        name: 'asc',
      },
    });
  },

  /**
   * Get one subject belonging to a specific user.
   */
  findById(userId: string, subjectId: string) {
    return prisma.subjects.findFirst({
      where: {
        id: subjectId,
        userId,
      },
    });
  },

  /**
   * Create a subject for a specific user.
   */
  create(userId: string, name: string) {
    return prisma.subjects.create({
      data: {
        id: randomUUID(),
        name,
        userId,
        updatedAt: new Date(),
      },
    });
  },

  /**
   * Update a subject belonging to a specific user.
   */
  update(userId: string, subjectId: string, name: string) {
    return prisma.subjects.updateMany({
      where: {
        id: subjectId,
        userId,
      },
      data: {
        name,
      },
    });
  },

  /**
   * Delete a subject belonging to a specific user.
   */
  delete(userId: string, subjectId: string) {
    return prisma.subjects.deleteMany({
      where: {
        id: subjectId,
        userId,
      },
    });
  },
};