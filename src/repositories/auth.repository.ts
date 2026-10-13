import { prisma } from "@/lib/prisma";
import { normalizeEmail } from "@/utils/email";

export class AuthRepository {
  async findUserByEmail(email: string) {
    return prisma.user.findFirst({
      where: {
        email: {
          equals: normalizeEmail(email),
          mode: "insensitive",
        },
      },
    });
  }
}

export const authRepository = new AuthRepository();
