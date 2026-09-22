import { prisma } from "@/lib/prisma";
export class AuthRepository {
    async findUserByEmail(email) {
        return prisma.user.findUnique({ where: { email } });
    }
}
export const authRepository = new AuthRepository();
//# sourceMappingURL=auth.repository.js.map