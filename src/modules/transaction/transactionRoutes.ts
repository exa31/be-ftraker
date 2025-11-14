import {Router} from "express";
import TransactionService from "./transactionService";
import {wrappingDbTransaction} from "../../utils/db";

const router = Router();

// GET tanpa transaction → tidak perlu session
router.get("/transactions", TransactionService.getTransactions);

// POST pakai transaction wrapper
router.post(
    "/transactions",
    wrappingDbTransaction(TransactionService.createTransaction)
);

// PUT pakai transaction wrapper
router.put(
    "/transactions/:transactionId",
    wrappingDbTransaction(TransactionService.updateTransaction)
);

// DELETE pakai transaction wrapper
router.delete(
    "/transactions/:transactionId",
    wrappingDbTransaction(TransactionService.deleteTransaction)
);

export default router;
