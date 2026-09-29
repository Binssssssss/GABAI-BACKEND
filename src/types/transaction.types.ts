export interface CreateTransactionInput {
  title: string;
  amount: number;
  type: 'expense' | 'income';
  category: string;
}

export interface TransactionResponse {
  id: string;
  title: string;
  amount: number;
  type: 'expense' | 'income';
  category: string;
  userId: string;
  date: string;
  createdAt: Date;
  updatedAt: Date;
}
export interface WalletBalanceResponse {
  netBalance: number;
  totalIncome: number;
  totalExpenses: number;
}