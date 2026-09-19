import { prisma } from "@/lib/prisma";
import { UserData } from "@/types/user.types";

export class UserRepository {
  async create(data: UserData) {
    return prisma.user.create({ data });
  }

  async findByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email },
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
      data,
    });
  }
}

export const userRepository = new UserRepository();