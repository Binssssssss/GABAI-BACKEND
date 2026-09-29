import { Request, Response } from "express";

import * as transactionService from "@/services/transaction.service";

type TransactionIdParams = {
  id: string;
};

export const getTransactions = async (
  req: Request,
  res: Response,
) => {
  try {
    const userId = req.user.userId;

    const transactions =
      await transactionService.getTransactionsByUser(userId);

    return res.status(200).json({
      success: true,
      data: transactions,
    });
  } catch (error) {
    console.error("Failed to get transactions:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch transactions.",
    });
  }
};

export const getTransactionById = async (
  req: Request<TransactionIdParams>,
  res: Response,
) => {
  try {
    const userId = req.user.userId;
    const id = req.params.id;

    const transaction =
      await transactionService.getTransactionById(
        userId,
        id,
      );

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found.",
      });
    }

    return res.status(200).json({
      success: true,
      data: transaction,
    });
  } catch (error) {
    console.error("Failed to get transaction:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch transaction.",
    });
  }
};

export const createTransaction = async (
  req: Request,
  res: Response,
) => {
  try {
    const userId = req.user.userId;

    const {
      title,
      amount,
      type,
      category,
      date,
    } = req.body;

    if (
      !title ||
      amount === undefined ||
      !type ||
      !category
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Title, amount, type, and category are required.",
      });
    }

    const transaction =
      await transactionService.createTransaction(
        userId,
        {
          title,
          amount: Number(amount),
          type,
          category,
          date,
        },
      );

    return res.status(201).json({
      success: true,
      data: transaction,
    });
  } catch (error) {
    console.error("Failed to create transaction:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create transaction.",
    });
  }
};

export const updateTransaction = async (
  req: Request<TransactionIdParams>,
  res: Response,
) => {
  try {
    const userId = req.user.userId;
    const id = req.params.id;

    const transaction =
      await transactionService.updateTransaction(
        userId,
        id,
        req.body,
      );

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found.",
      });
    }

    return res.status(200).json({
      success: true,
      data: transaction,
    });
  } catch (error) {
    console.error("Failed to update transaction:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update transaction.",
    });
  }
};

export const deleteTransaction = async (
  req: Request<TransactionIdParams>,
  res: Response,
) => {
  try {
    const userId = req.user.userId;
    const id = req.params.id;

    const transaction =
      await transactionService.deleteTransaction(
        userId,
        id,
      );

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Transaction deleted successfully.",
    });
  } catch (error) {
    console.error("Failed to delete transaction:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete transaction.",
    });
  }
};

export const getWalletBalance = async (
  req: Request,
  res: Response,
) => {
  try {
    const userId = req.user.userId;

    const balance =
      await transactionService.getWalletBalance(userId);

    return res.status(200).json({
      success: true,
      data: balance,
    });
  } catch (error) {
    console.error("Failed to get wallet balance:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch wallet balance.",
    });
  }
};