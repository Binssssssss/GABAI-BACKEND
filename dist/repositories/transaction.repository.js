import { prisma } from '../lib/prisma';
export const transactionRepository = {
    create: async (userId, data) => {
        return prisma.transaction.create({
            data: {
                title: data.title,
                amount: data.amount,
                type: data.type,
                category: data.category,
                userId,
            },
        });
    },
    findAllByUserId: async (userId) => {
        return prisma.transaction.findMany({
            where: {
                userId,
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
    },
    findById: async (id, userId) => {
        return prisma.transaction.findFirst({
            where: {
                id,
                userId,
            },
        });
    },
    update: async (id, userId, data) => {
        const transaction = await prisma.transaction.findFirst({
            where: { id, userId },
        });
        if (!transaction) {
            throw new Error('Transaction not found');
        }
        return prisma.transaction.update({
            where: { id },
            data: {
                ...(data.title !== undefined && { title: data.title }),
                ...(data.amount !== undefined && { amount: data.amount }),
                ...(data.type !== undefined && { type: data.type }),
                ...(data.category !== undefined && { category: data.category }),
            },
        });
    },
    delete: async (id, userId) => {
        const transaction = await prisma.transaction.findFirst({
            where: { id, userId },
        });
        if (!transaction) {
            throw new Error('Transaction not found');
        }
        await prisma.transaction.delete({
            where: { id },
        });
        return transaction;
    },
    getBalance: async (userId) => {
        const result = await prisma.transaction.groupBy({
            by: ['type'],
            where: { userId },
            _sum: { amount: true },
        });
        const income = result
            .find((entry) => entry.type === 'income')
            ?._sum.amount ?? 0;
        const expense = result
            .find((entry) => entry.type === 'expense')
            ?._sum.amount ?? 0;
        return {
            income,
            expense,
            balance: income - expense,
        };
    },
    getWalletBalance: async (userId) => {
        const transactions = await prisma.transaction.findMany({
            where: {
                userId,
            },
            select: {
                amount: true,
                type: true,
            },
        });
        let totalIncome = 0;
        let totalExpenses = 0;
        for (const transaction of transactions) {
            if (transaction.type === 'income') {
                totalIncome += transaction.amount;
            }
            if (transaction.type === 'expense') {
                totalExpenses += transaction.amount;
            }
        }
        const netBalance = totalIncome - totalExpenses;
        return {
            netBalance,
            totalIncome,
            totalExpenses,
        };
    },
};
//# sourceMappingURL=transaction.repository.js.map