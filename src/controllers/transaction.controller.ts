import { Request, Response } from "express";
import {
  createTransaction as createTransactionService,
  getTransactions as getTransactionsService,
  getTransaction as getTransactionService,
  updateTransaction as updateTransactionService,
  deleteTransaction as deleteTransactionService,
  getWalletBalance as getWalletBalanceService,
} from "../services/transaction.service";

export async function createTransaction(
  req: Request,
  res: Response
) {
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
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to create transaction";

    return res.status(400).json({
      success: false,
      message,
    });
  }
}

export async function getTransactions(
  req: Request,
  res: Response
) {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const transactions = await getTransactionsService(userId);

    return res.status(200).json({
      success: true,
      message: "Transactions retrieved successfully",
      data: transactions,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve transactions",
    });
  }
}

export async function getTransaction(
  req: Request,
  res: Response
) {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const transaction = await getTransactionService(
      String(req.params.id),
      userId
    );

    return res.status(200).json({
      success: true,
      data: transaction,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Transaction not found";

    return res.status(404).json({
      success: false,
      message,
    });
  }
}

export async function updateTransaction(
  req: Request,
  res: Response
) {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const transaction = await updateTransactionService(
      String(req.params.id),
      userId,
      req.body
    );

    return res.status(200).json({
      success: true,
      message: "Transaction updated successfully",
      data: transaction,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to update transaction";

    return res.status(400).json({
      success: false,
      message,
    });
  }
}

export async function deleteTransaction(
  req: Request,
  res: Response
) {
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
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to delete transaction";

    return res.status(404).json({
      success: false,
      message,
    });
  }
}

export async function getWalletBalance(
  req: Request,
  res: Response
) {
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
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve wallet balance",
    });
  }
}