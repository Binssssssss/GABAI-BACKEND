import { transactionRepository } from "../repositories/transaction.repository.js";
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
        throw new Error("Transaction not found");
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