import { prisma } from "@/lib/prisma";
export const recentActivityRepository = {
    async getRecentActivities(userId, limit = 5) {
        return prisma.recentActivity.findMany({
            where: {
                userId,
            },
            orderBy: {
                createdAt: "desc",
            },
            take: limit,
        });
    },
    async createActivity(userId, data) {
        return prisma.recentActivity.create({
            data: {
                userId,
                icon: data.icon,
                text: data.text,
                type: data.type,
            },
        });
    },
    async deleteActivity(id, userId) {
        return prisma.recentActivity.deleteMany({
            where: {
                id,
                userId,
            },
        });
    },
    async deleteOldActivities(userId, keep = 20) {
        const activities = await prisma.recentActivity.findMany({
            where: {
                userId,
            },
            orderBy: {
                createdAt: "desc",
            },
            select: {
                id: true,
            },
            skip: keep,
        });
        if (activities.length === 0) {
            return;
        }
        await prisma.recentActivity.deleteMany({
            where: {
                userId,
                id: {
                    in: activities.map((activity) => activity.id),
                },
            },
        });
    },
};
//# sourceMappingURL=recent-activity.repository.js.map