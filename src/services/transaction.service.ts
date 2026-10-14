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
    date: Date;
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
  // The date the user picked, not when the row was created
  date: transaction.date.toISOString(),
  createdAt: transaction.createdAt,
  updatedAt: transaction.updatedAt,
});

const formatAmount = (amount: number): string =>
  amount.toLocaleString("en-PH", {
    style: "currency",
    currency: "PHP",
  });

// ======================================================
// BALANCE RULES: the wallet can never go below ₱0
// ======================================================

/** Avoid floating-point leftovers like 0.30000000000000004 */
const roundMoney = (value: number): number =>
  Math.round(value * 100) / 100;

/** Income adds to the balance, an expense subtracts from it. */
const effectOnBalance = (type: string, amount: number): number =>
  type === "income" ? amount : type === "expense" ? -amount : 0;

/** The real balance from the database (may be negative for old data). */
const getRawBalance = async (userId: string): Promise<number> => {
  const { netBalance } =
    await transactionRepository.getWalletBalance(userId);

  return roundMoney(netBalance);
};

const validateAmount = (amount: unknown): number => {
  const value = Number(amount);

  if (!Number.isFinite(value) || value <= 0) {
    throw new Error("Amount must be greater than ₱0.");
  }

  return roundMoney(value);
};

/** Reject dates the app could not have meant (e.g. "abc"). */
const validateDate = (date: unknown): string | undefined => {
  if (date === undefined || date === null || date === "") {
    return undefined;
  }

  const parsed = new Date(String(date));

  if (Number.isNaN(parsed.getTime())) {
    throw new Error("Invalid transaction date.");
  }

  return parsed.toISOString();
};

const insufficientBalanceError = (balance: number) =>
  new Error(
    `Insufficient balance. You only have ${formatAmount(
      Math.max(0, balance),
    )} left.`,
  );

// ======================================================
// SERVICES
// ======================================================

export const createTransaction = async (
  userId: string,
  data: CreateTransactionInput,
): Promise<TransactionResponse> => {
  const amount = validateAmount(data.amount);

  if (data.type !== "income" && data.type !== "expense") {
    throw new Error('Type must be "income" or "expense".');
  }

  // An expense can't be bigger than what's in the wallet.
  if (data.type === "expense") {
    const balance = await getRawBalance(userId);

    if (amount > balance) {
      throw insufficientBalanceError(balance);
    }
  }

  const transaction = await transactionRepository.create(userId, {
    ...data,
    amount,
    date: validateDate(data.date),
  });

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
  const existing = await transactionRepository.findById(id, userId);

  if (!existing) {
    throw new Error("Transaction not found");
  }

  const newType = data.type ?? existing.type;
  const newAmount =
    data.amount !== undefined
      ? validateAmount(data.amount)
      : existing.amount;

  // Balance after the edit = remove the old effect, add the new one.
  const balance = await getRawBalance(userId);
  const balanceAfter = roundMoney(
    balance -
      effectOnBalance(existing.type, existing.amount) +
      effectOnBalance(newType, newAmount),
  );

  if (balanceAfter < 0 && balanceAfter < balance) {
    throw new Error(
      "This change would make your wallet balance negative.",
    );
  }

  const transaction =
    await transactionRepository.update(
      id,
      userId,
      {
        ...data,
        ...(data.amount !== undefined && { amount: newAmount }),
        ...(data.date !== undefined && { date: validateDate(data.date) }),
      },
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

  // Deleting an income lowers the balance, so check it first.
  if (existing.type === "income") {
    const balance = await getRawBalance(userId);

    if (roundMoney(balance - existing.amount) < 0) {
      throw new Error(
        "You can't delete this income because your balance would go below ₱0. Delete some expenses first.",
      );
    }
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
  const balance =
    await transactionRepository.getWalletBalance(userId);

  return {
    ...balance,
    // Never show a negative balance (old data is clamped to ₱0).
    netBalance: Math.max(0, roundMoney(balance.netBalance)),
  };
};    