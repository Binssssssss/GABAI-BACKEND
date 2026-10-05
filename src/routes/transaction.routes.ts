import { Router } from "express";

import * as transactionController from "@/controllers/transaction.controller";
import { authMiddleware } from "@/middlewares/authenticate-token";

const router = Router();



router.use(authMiddleware);


router.get("/", transactionController.getTransactions);

router.get("/balance", transactionController.getWalletBalance);

router.get("/:id", transactionController.getTransactionById);

router.post("/", transactionController.createTransaction);

router.put("/:id", transactionController.updateTransaction);

router.delete("/:id", transactionController.deleteTransaction);

export default router;
import { Router } from "express";

import {
  createTransaction,
  getTransactions,
  getTransaction,
  updateTransaction,
  deleteTransaction,
  getWalletBalance,
} from "../controllers/transaction.controller";

import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

router.use(authMiddleware);

router.post("/", createTransaction);

router.get("/", getTransactions);

router.get("/balance", getWalletBalance);

router.get("/:id", getTransaction);

router.patch("/:id", updateTransaction);

router.delete("/:id", deleteTransaction);

export default router;