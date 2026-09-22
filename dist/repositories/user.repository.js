import { prisma } from "@/lib/prisma";
export class UserRepository {
    async create(data) {
        return prisma.user.create({ data });
    }
    async findByEmail(email) {
        return prisma.user.findUnique({
            where: { email },
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
            data,
        });
    }
}
export const userRepository = new UserRepository();
//# sourceMappingURL=user.repository.js.map