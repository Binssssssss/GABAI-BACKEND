import { prisma } from "../lib/prisma.js";
import { normalizeEmail } from "../utils/email.js";
export class AuthRepository {
    async findUserByEmail(email) {
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
//# sourceMappingURL=auth.repository.js.map