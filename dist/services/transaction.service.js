import { prisma } from "@/lib/prisma";
export const getTransactionsByUser = async (userId) => {
    return prisma.transaction.findMany({
        where: {
            userId,
        },
        orderBy: {
            date: "desc",
        },
    });
};
export const getTransactionById = async (userId, transactionId) => {
    return prisma.transaction.findFirst({
        where: {
            id: transactionId,
            userId,
        },
    });
};
export const createTransaction = async (userId, data) => {
    return prisma.transaction.create({
        data: {
            title: data.title,
            amount: data.amount,
            type: data.type,
            category: data.category,
            userId,
            ...(data.date
                ? {
                    date: new Date(data.date),
                }
                : {}),
        },
    });
};
export const updateTransaction = async (userId, transactionId, data) => {
    const transaction = await prisma.transaction.findFirst({
        where: {
            id: transactionId,
            userId,
        },
    });
    if (!transaction) {
        return null;
    }
    return prisma.transaction.update({
        where: {
            id: transaction.id,
        },
        data: {
            ...(data.title !== undefined && {
                title: data.title,
            }),
            ...(data.amount !== undefined && {
                amount: data.amount,
            }),
            ...(data.type !== undefined && {
                type: data.type,
            }),
            ...(data.category !== undefined && {
                category: data.category,
            }),
            ...(data.date !== undefined && {
                date: new Date(data.date),
            }),
        },
    });
};
export const deleteTransaction = async (userId, transactionId) => {
    const transaction = await prisma.transaction.findFirst({
        where: {
            id: transactionId,
            userId,
        },
    });
    if (!transaction) {
        return null;
    }
    return prisma.transaction.delete({
        where: {
            id: transaction.id,
        },
    });
};
export const getWalletBalance = async (userId) => {
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
        if (transaction.type === "income") {
            totalIncome += transaction.amount;
        }
        if (transaction.type === "expense") {
            totalExpenses += transaction.amount;
        }
    }
    return {
        netBalance: totalIncome - totalExpenses,
        totalIncome,
        totalExpenses,
    };
};
import { transactionRepository } from '../repositories/transaction.repository';
const mapTransaction = (transaction) => ({
    id: transaction.id,
    title: transaction.title,
    amount: transaction.amount,
    type: transaction.type,
    category: transaction.category,
    userId: transaction.userId,
    date: transaction.createdAt.toISOString(),
    createdAt: transaction.createdAt,
    updatedAt: transaction.updatedAt,
});
export const createTransaction = async (userId, data) => {
    const transaction = await transactionRepository.create(userId, data);
    return mapTransaction(transaction);
};
export const getTransactions = async (userId) => {
    const transactions = await transactionRepository.findAllByUserId(userId);
    return transactions.map(mapTransaction);
};
export const getTransaction = async (id, userId) => {
    const transaction = await transactionRepository.findById(id, userId);
    if (!transaction) {
        throw new Error('Transaction not found');
    }
    return mapTransaction(transaction);
};
export const updateTransaction = async (id, userId, data) => {
    const transaction = await transactionRepository.update(id, userId, data);
    return mapTransaction(transaction);
};
export const deleteTransaction = async (id, userId) => {
    await transactionRepository.delete(id, userId);
};
export const getWalletBalance = async (userId) => {
    return transactionRepository.getWalletBalance(userId);
};
//# sourceMappingURL=transaction.service.js.map