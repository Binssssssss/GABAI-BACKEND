import { transactionRepository } from "../repositories/transaction.repository";

import {
  CreateTransactionInput,
  TransactionResponse,
} from "../types/transaction.types";

import {
  sendPushNotificationSafely,
} from "@/services/push-notification.service";

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
  },
): TransactionResponse => ({
  id: transaction.id,
  title: transaction.title,
  amount: transaction.amount,
  type: transaction.type as "expense" | "income",
  category: transaction.category,
  userId: transaction.userId,
  date: transaction.createdAt.toISOString(),
  createdAt: transaction.createdAt,
  updatedAt: transaction.updatedAt,
});

const formatAmount = (amount: number): string =>
  amount.toLocaleString("en-PH", {
    style: "currency",
    currency: "PHP",
  });

export const createTransaction = async (
  userId: string,
  data: CreateTransactionInput,
): Promise<TransactionResponse> => {
  const transaction = await transactionRepository.create(
    userId,
    data,
  );

  await sendPushNotificationSafely({
    userId,
    title:
      transaction.type === "income"
        ? "Income Recorded"
        : "Expense Recorded",
    message: `${transaction.title}: ${formatAmount(transaction.amount)}.`,
    type: "wallet_transaction_created",
    data: {
      transactionId: transaction.id,
      transactionType: transaction.type,
    },
  });

  return mapTransaction(transaction);
};

export const getTransactions = async (
  userId: string,
): Promise<TransactionResponse[]> => {
  const transactions =
    await transactionRepository.findAllByUserId(userId);

  return transactions.map(mapTransaction);
};

export const getTransaction = async (
  id: string,
  userId: string,
): Promise<TransactionResponse> => {
  const transaction =
    await transactionRepository.findById(id, userId);

  if (!transaction) {
    throw new Error("Transaction not found");
  }

  return mapTransaction(transaction);
};

export const updateTransaction = async (
  id: string,
  userId: string,
  data: Partial<CreateTransactionInput>,
): Promise<TransactionResponse> => {
  const transaction =
    await transactionRepository.update(
      id,
      userId,
      data,
    );

  await sendPushNotificationSafely({
    userId,
    title: "Wallet Transaction Updated",
    message: `${transaction.title} was updated to ${formatAmount(transaction.amount)}.`,
    type: "wallet_transaction_updated",
    data: {
      transactionId: transaction.id,
      transactionType: transaction.type,
    },
  });

  return mapTransaction(transaction);
};

export const deleteTransaction = async (
  id: string,
  userId: string,
): Promise<void> => {
  // Fetch the transaction first so its details remain available
  // after the database deletion.
  const existing = await transactionRepository.findById(
    id,
    userId,
  );

  if (!existing) {
    throw new Error("Transaction not found");
  }

  await transactionRepository.delete(id, userId);

  await sendPushNotificationSafely({
    userId,
    title: "Wallet Transaction Deleted",
    message: `${existing.title} (${formatAmount(existing.amount)}) was deleted.`,
    type: "wallet_transaction_deleted",
    data: {
      transactionId: existing.id,
      transactionType: existing.type,
    },
  });
};

export const getWalletBalance = async (
  userId: string,
) => {
  return transactionRepository.getWalletBalance(userId);
};