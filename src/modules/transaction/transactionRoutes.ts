import {Elysia} from "elysia";
import TransactionService from "./transactionService";
import {AuthContext} from "../../types/context";

const TransactionRoutes = new Elysia()
    .get(
        '/transactions',
        async (ctx: AuthContext) => {
            return await TransactionService.getTransactions(ctx)
        }
    )
    .post(
        '/transactions',
        async (ctx: AuthContext) => {
            return await TransactionService.createTransaction(ctx)
        }
    )
    .put(
        '/transactions/:transactionId',
        async (ctx: AuthContext) => {
            return await TransactionService.updateTransaction(ctx)
        }
    )
    .delete(
        '/transactions/:transactionId',
        async (ctx: AuthContext) => {
            return await TransactionService.deleteTransaction(ctx)
        }
    )

export default TransactionRoutes
