import { Router } from "express";
import * as transactionController from "../controllers/transaction.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
const router = Router();
router.use(authMiddleware);
router.get("/", transactionController.getTransactions);
router.get("/balance", transactionController.getWalletBalance);
router.get("/:id", transactionController.getTransaction);
router.post("/", transactionController.createTransaction);
router.put("/:id", transactionController.updateTransaction);
router.delete("/:id", transactionController.deleteTransaction);
export default router;
//# sourceMappingURL=transaction.routes.js.map