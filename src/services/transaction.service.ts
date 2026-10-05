import { prisma } from "@/lib/prisma";

export interface CreateTransactionInput {
  title: string;
  amount: number;
  type: string;
  category: string;
  date?: string;
}

export interface UpdateTransactionInput {
  title?: string;
  amount?: number;
  type?: string;
  category?: string;
  date?: string;
}

export const getTransactionsByUser = async (userId: string) => {
  return prisma.transaction.findMany({
    where: {
      userId,
    },
    orderBy: {
      date: "desc",
    },
  });
};

export const getTransactionById = async (
  userId: string,
  transactionId: string,
) => {
  return prisma.transaction.findFirst({
    where: {
      id: transactionId,
      userId,
    },
  });
};

export const createTransaction = async (
  userId: string,
  data: CreateTransactionInput,
) => {
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

export const updateTransaction = async (
  userId: string,
  transactionId: string,
  data: UpdateTransactionInput,
) => {
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

export const deleteTransaction = async (
  userId: string,
  transactionId: string,
) => {
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

export const getWalletBalance = async (userId: string) => {
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
import {
  CreateTransactionInput,
  TransactionResponse,
} from '../types/transaction.types';

const mapTransaction = (
  transaction: {
    id: string;
    title: string;
    amount: number;
    type: string;
    category: string;
    userId: string;
    createdAt: Date;
    updatedAt: Date;
  }
): TransactionResponse => ({
  id: transaction.id,
  title: transaction.title,
  amount: transaction.amount,
  type: transaction.type as 'expense' | 'income',
  category: transaction.category,
  userId: transaction.userId,
  date: transaction.createdAt.toISOString(),
  createdAt: transaction.createdAt,
  updatedAt: transaction.updatedAt,
});

export const createTransaction = async (
  userId: string,
  data: CreateTransactionInput
): Promise<TransactionResponse> => {
  const transaction = await transactionRepository.create(userId, data);
  return mapTransaction(transaction);
};

export const getTransactions = async (
  userId: string
): Promise<TransactionResponse[]> => {
  const transactions = await transactionRepository.findAllByUserId(userId);
  return transactions.map(mapTransaction);
};

export const getTransaction = async (
  id: string,
  userId: string
): Promise<TransactionResponse> => {
  const transaction = await transactionRepository.findById(id, userId);

  if (!transaction) {
    throw new Error('Transaction not found');
  }

  return mapTransaction(transaction);
};

export const updateTransaction = async (
  id: string,
  userId: string,
  data: Partial<CreateTransactionInput>
): Promise<TransactionResponse> => {
  const transaction = await transactionRepository.update(id, userId, data);
  return mapTransaction(transaction);
};

export const deleteTransaction = async (
  id: string,
  userId: string
): Promise<void> => {
  await transactionRepository.delete(id, userId);
};

export const getWalletBalance = async (userId: string) => {
  return transactionRepository.getWalletBalance(userId);
};
