import { prisma } from "../lib/prisma.js";
export const upsertPushToken = async (userId, token, platform) => {
    return prisma.pushToken.upsert({
        where: {
            token,
        },
        update: {
            userId,
            platform,
            updatedAt: new Date(),
        },
        create: {
            token,
            platform,
            userId,
        },
    });
};
export const getPushTokensByUserId = async (userId) => {
    return prisma.pushToken.findMany({
        where: {
            userId,
        },
    });
};
export const deletePushToken = async (userId, token) => {
    return prisma.pushToken.deleteMany({
        where: {
            userId,
            token,
        },
    });
};
//# sourceMappingURL=push-token.repository.js.map