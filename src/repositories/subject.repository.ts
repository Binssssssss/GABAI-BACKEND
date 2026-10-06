import { randomUUID } from 'node:crypto';
import { prisma } from '@/lib/prisma';

export const subjectRepository = {
  /**
   * Get all subjects belonging to a specific user.
   */
  findAllByUser(userId: string) {
    return prisma.subject.findMany({
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
    return prisma.subject.findFirst({
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
    return prisma.subject.create({
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
    return prisma.subject.updateMany({
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
    return prisma.subject.deleteMany({
      where: {
        id: subjectId,
        userId,
      },
    });
  },
};