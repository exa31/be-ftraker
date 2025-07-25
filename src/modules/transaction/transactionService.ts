import {ResponseModel} from "../../types/response";
import logger from "../../utils/logger";
import {formatErrorValidation, validate} from "../../utils/validation";
import {createTransactionBodySchema, getTransactionQuerySchema, updateTransactionBodySchema} from "./transactionSchema";
import zod, {ZodError} from "zod";
import {ErrorResponse, SuccessResponse} from "../../utils/response";
import TransactionModel from "./transactionModel";
import {AuthContext} from "../../types/context";
import useSelectedView from "../../utils/selectedViewPeriode";
import {getTransaction, responseCreateTransaction, responseUpdateTransaction} from "../../types/transaction";

class TransactionService {

    static async getTransactions(ctx: AuthContext): Promise<ResponseModel<getTransaction | Record<string, string> | null | string>> {
        try {
            validate(ctx.query, getTransactionQuerySchema)
            const {view} = ctx.query as zod.infer<typeof getTransactionQuerySchema>;
            const user = ctx.user; // Assuming user is set in the context state after authentication
            const {lastPeriode, currentPeriode} = useSelectedView(view);
            if (view === "All") {
                const all = await TransactionModel
                    .find({user: user.id})
                    .sort({createdAt: -1});
                ctx.set.status = 200;
                return SuccessResponse<getTransaction>({
                    current: all,
                    last: []
                }, "All transactions retrieved successfully", 200);
            }
            const current = await TransactionModel
                .find({user: user.id})
                .sort({createdAt: -1})
                .gte("createdAt", currentPeriode().start)
                .lte("createdAt", currentPeriode().end)
                .gte("createdAt", currentPeriode().start);
            const last = await TransactionModel
                .find({user: user.id})
                .sort({createdAt: -1})
                .gte("createdAt", lastPeriode().start)
                .lte("createdAt", lastPeriode().end);

            ctx.set.status = 200;
            return SuccessResponse<getTransaction>({
                current: current,
                last: last
            }, "Transactions retrieved successfully", 200);
        } catch (error) {
            // Log the error for debugging purposes
            logger.error(`Error in getTransactions handler: ${JSON.stringify(error)}`);
            if (error instanceof ZodError) {
                const message = formatErrorValidation(error);
                ctx.set.status = 400;
                return ErrorResponse<Record<string, string>>("Validation error", message, 400);
            }
            ctx.set.status = 500;
            return ErrorResponse<string>("Internal server error", (error as Error).message, 500);
        }
    }

    static async createTransaction(ctx: AuthContext): Promise<ResponseModel<responseCreateTransaction | null | string | Record<string, string>>> {
        try {
            validate(ctx.body, createTransactionBodySchema)
            const {amount, type, description, createdAt} = ctx.body as zod.infer<typeof createTransactionBodySchema>;
            const user = ctx.user;
            const transaction = new TransactionModel({
                user: user.id,
                amount,
                type,
                description,
                createdAt: createdAt,
            })
            await transaction.save();
            logger.info(`Transaction created successfully for user ${user.email}`);
            ctx.set.status = 201;
            return SuccessResponse<responseCreateTransaction>(
                transaction
                , "Transaction created successfully", 201);

        } catch (error) {
            // Log the error for debugging purposes
            logger.error(`Error in createTransaction handler: ${JSON.stringify(error)}`);
            if (error instanceof ZodError) {
                const message = formatErrorValidation(error);
                ctx.set.status = 400;
                return ErrorResponse<Record<string, string>>("Validation error", message, 400);
            }
            ctx.set.status = 500;
            return ErrorResponse<string>("Internal server error", (error as Error).message, 500);
        }
    }

    static async updateTransaction(ctx: AuthContext): Promise<ResponseModel<responseUpdateTransaction | null | string | Record<string, string>>> {
        try {
            validate(ctx.body, updateTransactionBodySchema)
            const {amount, type, description, createdAt} = ctx.body as zod.infer<typeof createTransactionBodySchema>;
            const {transactionId} = ctx.params;
            const user = ctx.user; // Assuming user is set in the context state after authentication
            const transaction = await TransactionModel.findOne({_id: transactionId, user: user.id});
            if (!transaction) {
                logger.error(`Transaction with id ${transactionId} not found for user ${user.email}`);
                ctx.set.status = 404;
                return ErrorResponse<string>("Not Found", "Transaction not found", 404);
            }
            transaction.amount = amount;
            transaction.type = type;
            transaction.description = description;
            transaction.createdAt = createdAt ? new Date(createdAt) : transaction.createdAt;
            await transaction.save();
            logger.info(`Transaction with id ${transactionId} updated successfully for user ${user.email}`);
            ctx.set.status = 200;
            return SuccessResponse<responseUpdateTransaction>(transaction, "Transaction updated successfully", 200);
        } catch (error) {
            // Log the error for debugging purposes
            logger.error(`Error in updateTransaction handler: ${JSON.stringify(error)}`);
            if (error instanceof ZodError) {
                const message = formatErrorValidation(error);
                ctx.set.status = 400;
                return ErrorResponse<Record<string, string>>("Validation error", message, 400);
            }
            ctx.set.status = 500;
            return ErrorResponse<string>("Internal server error", (error as Error).message, 500);
        }
    }

    static async deleteTransaction(ctx: AuthContext): Promise<ResponseModel<string | null>> {
        try {
            const {transactionId} = ctx.params;
            const user = ctx.user; // Assuming user is set in the context state after authentication
            const transaction = await TransactionModel.findOneAndDelete({_id: transactionId, user: user.id});
            if (!transaction) {
                logger.error(`Transaction with id ${transactionId} not found for user ${user.email}`);
                ctx.set.status = 404;
                return ErrorResponse<string>("Not Found", "Transaction not found", 404);
            }
            logger.info(`Transaction with id ${transactionId} deleted successfully for user ${user.email}`);
            ctx.set.status = 200;
            return SuccessResponse<null>(null, "Transaction deleted successfully", 200);
        } catch (error) {
            // Log the error for debugging purposes
            logger.error(`Error in deleteTransaction handler: ${JSON.stringify(error)}`);
            ctx.set.status = 500;
            return ErrorResponse<string>("Internal server error", (error as Error).message, 500);
        }
    }
}

export default TransactionService;