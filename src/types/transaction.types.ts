export interface CreateTransactionInput {
  title: string;
  amount: number;
  type: 'expense' | 'income';
  category: string;
  /** ISO date picked in the app; defaults to now */
  date?: string;
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
/** One page of transactions (GET /transactions?limit=&offset=). */
export interface TransactionPage {
  transactions: TransactionResponse[];
  pagination: {
    limit: number;
    offset: number;
    total: number;
    hasMore: boolean;
    nextOffset: number | null;
  };
}

export interface WalletBalanceResponse {
  netBalance: number;
  totalIncome: number;
  totalExpenses: number;
}