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