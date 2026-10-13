import { prisma } from "@/lib/prisma";

export const upsertPushToken = async (
  userId: string,
  token: string,
  platform: string
) => {
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

export const getPushTokensByUserId = async (userId: string) => {
  return prisma.pushToken.findMany({
    where: {
      userId,
    },
  });
};

export const deletePushToken = async (
  userId: string,
  token: string
) => {
  return prisma.pushToken.deleteMany({
    where: {
      userId,
      token,
    },
  });
};