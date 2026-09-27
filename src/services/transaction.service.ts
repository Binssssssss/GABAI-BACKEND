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
