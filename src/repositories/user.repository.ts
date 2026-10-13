import { prisma } from "@/lib/prisma";
import { UserData } from "@/types/user.types";
import { normalizeEmail } from "@/utils/email";

export class UserRepository {
  async create(data: UserData) {
    return prisma.user.create({
      data: {
        ...data,
        email: normalizeEmail(data.email),
      },
    });
  }

  async findByEmail(email: string) {
    return prisma.user.findFirst({
      where: {
        email: {
          equals: normalizeEmail(email),
          mode: "insensitive",
        },
      },
    });
  }

  async findByFirebaseUid(firebaseUid: string) {
    return prisma.user.findUnique({
      where: { firebaseUid },
    });
  }

  async findById(id: string) {
    return prisma.user.findUnique({
      where: { id },
    });
  }

  async update(id: string, data: Partial<UserData>) {
    return prisma.user.update({
      where: { id },
      data: {
        ...data,
        ...(data.email ? { email: normalizeEmail(data.email) } : {}),
      },
    });
  }
}

export const userRepository = new UserRepository();