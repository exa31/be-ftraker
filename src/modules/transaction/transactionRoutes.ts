import {Elysia} from "elysia";
import TransactionService from "./transactionService";
import {AuthContext} from "../../types/context";
import {wrappingDbTransaction} from "../../utils/db";

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
            return await wrappingDbTransaction(ctx, TransactionService.createTransaction)
        }
    )
    .put(
        '/transactions/:transactionId',
        async (ctx: AuthContext) => {
            return await wrappingDbTransaction(ctx, TransactionService.updateTransaction)
        }
    )
    .delete(
        '/transactions/:transactionId',
        async (ctx: AuthContext) => {
            return await wrappingDbTransaction(ctx, TransactionService.deleteTransaction)
        }
    )

export default TransactionRoutes
