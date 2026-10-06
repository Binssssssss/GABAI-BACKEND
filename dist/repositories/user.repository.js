import { prisma } from "../lib/prisma.js";
import { normalizeEmail } from "../utils/email.js";
export class UserRepository {
    async create(data) {
        return prisma.user.create({
            data: {
                ...data,
                email: normalizeEmail(data.email),
            },
        });
    }
    async findByEmail(email) {
        return prisma.user.findFirst({
            where: {
                email: {
                    equals: normalizeEmail(email),
                    mode: "insensitive",
                },
            },
        });
    }
    async findByFirebaseUid(firebaseUid) {
        return prisma.user.findUnique({
            where: { firebaseUid },
        });
    }
    async findById(id) {
        return prisma.user.findUnique({
            where: { id },
        });
    }
    async update(id, data) {
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
//# sourceMappingURL=user.repository.js.map