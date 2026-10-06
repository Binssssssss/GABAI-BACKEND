import { createTransaction as createTransactionService, getTransactions as getTransactionsService, getTransaction as getTransactionService, updateTransaction as updateTransactionService, deleteTransaction as deleteTransactionService, getWalletBalance as getWalletBalanceService, } from "../services/transaction.service.js";
export async function createTransaction(req, res) {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Authentication required",
            });
        }
        const transaction = await createTransactionService(userId, req.body);
        return res.status(201).json({
            success: true,
            message: "Transaction created successfully",
            data: transaction,
        });
    }
    catch (error) {
        console.error("CREATE TRANSACTION ERROR:", error);
        return res.status(400).json({
            success: false,
            message: error instanceof Error
                ? error.message
                : "Failed to create transaction",
        });
    }
}
export async function getTransactions(req, res) {
    try {
        const userId = req.user?.id;
        console.log("GET TRANSACTIONS USER ID:", userId);
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Authentication required",
            });
        }
        const transactions = await getTransactionsService(userId);
        console.log("GET TRANSACTIONS RESULT:", transactions);
        return res.status(200).json({
            success: true,
            message: "Transactions retrieved successfully",
            data: transactions,
        });
    }
    catch (error) {
        console.error("GET TRANSACTIONS ERROR:", error);
        return res.status(500).json({
            success: false,
            message: error instanceof Error
                ? error.message
                : "Failed to retrieve transactions",
        });
    }
}
export async function getTransaction(req, res) {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Authentication required",
            });
        }
        const transaction = await getTransactionService(String(req.params.id), userId);
        return res.status(200).json({
            success: true,
            data: transaction,
        });
    }
    catch (error) {
        console.error("GET TRANSACTION ERROR:", error);
        return res.status(404).json({
            success: false,
            message: error instanceof Error
                ? error.message
                : "Transaction not found",
        });
    }
}
export async function updateTransaction(req, res) {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Authentication required",
            });
        }
        const transaction = await updateTransactionService(String(req.params.id), userId, req.body);
        return res.status(200).json({
            success: true,
            message: "Transaction updated successfully",
            data: transaction,
        });
    }
    catch (error) {
        console.error("UPDATE TRANSACTION ERROR:", error);
        return res.status(400).json({
            success: false,
            message: error instanceof Error
                ? error.message
                : "Failed to update transaction",
        });
    }
}
export async function deleteTransaction(req, res) {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Authentication required",
            });
        }
        await deleteTransactionService(String(req.params.id), userId);
        return res.status(200).json({
            success: true,
            message: "Transaction deleted successfully",
        });
    }
    catch (error) {
        console.error("DELETE TRANSACTION ERROR:", error);
        return res.status(404).json({
            success: false,
            message: error instanceof Error
                ? error.message
                : "Failed to delete transaction",
        });
    }
}
export async function getWalletBalance(req, res) {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Authentication required",
            });
        }
        const balance = await getWalletBalanceService(userId);
        return res.status(200).json({
            success: true,
            message: "Wallet balance retrieved successfully",
            data: balance,
        });
    }
    catch (error) {
        console.error("GET WALLET BALANCE ERROR:", error);
        return res.status(500).json({
            success: false,
            message: error instanceof Error
                ? error.message
                : "Failed to retrieve wallet balance",
        });
    }
}
//# sourceMappingURL=transaction.controller.js.map