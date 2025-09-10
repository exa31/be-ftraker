import {ResponseModel} from "../../types/response";
import logger from "../../utils/logger";
import {formatErrorValidation, validate} from "../../utils/validation";
import {createTransactionBodySchema, getTransactionQuerySchema, updateTransactionBodySchema} from "./transactionSchema";
import zod, {ZodError} from "zod";
import {ErrorResponse, SuccessResponse} from "../../utils/response";
import TransactionModel from "./transactionModel";
import {AuthContext} from "../../types/context";
import useSelectedView from "../../utils/selectedViewPeriode";
import {
    AggregateTransactionSummary,
    getTransaction,
    responseCreateTransaction,
    responseUpdateTransaction
} from "../../types/transaction";
import {toZonedTime} from "date-fns-tz";
import mongoose from "mongoose";
import {subDays} from "date-fns";
import {formatCurrency} from "../../utils/currency";
import mailService from "../mail/mailService";
import path from "path";
import fs from "fs";

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

    static async createTransaction(ctx: AuthContext, session: mongoose.ClientSession): Promise<ResponseModel<responseCreateTransaction | null | string | Record<string, string>>> {
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
        await transaction.save({session});
        logger.info(`Transaction created successfully for user ${user.email}`);
        ctx.set.status = 201;
        return SuccessResponse<responseCreateTransaction>(
            transaction
            , "Transaction created successfully", 201);
    }

    static async updateTransaction(ctx: AuthContext, session: mongoose.ClientSession): Promise<ResponseModel<responseUpdateTransaction | null | string | Record<string, string>>> {
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
        await transaction.save({session});
        logger.info(`Transaction with id ${transactionId} updated successfully for user ${user.email}`);
        ctx.set.status = 200;
        return SuccessResponse<responseUpdateTransaction>(transaction, "Transaction updated successfully", 200);
    }

    static async deleteTransaction(ctx: AuthContext, session: mongoose.ClientSession): Promise<ResponseModel<string | null>> {
        const {transactionId} = ctx.params;
        const user = ctx.user; // Assuming user is set in the context state after authentication
        const transaction = await TransactionModel.findOneAndDelete({_id: transactionId, user: user.id}, {session});
        if (!transaction) {
            logger.error(`Transaction with id ${transactionId} not found for user ${user.email}`);
            ctx.set.status = 404;
            return ErrorResponse<string>("Not Found", "Transaction not found", 404);
        }
        logger.info(`Transaction with id ${transactionId} deleted successfully for user ${user.email}`);
        ctx.set.status = 200;
        return SuccessResponse<null>(null, "Transaction deleted successfully", 200);
    }

    private static async getWeeklySummaryEmail(): Promise<AggregateTransactionSummary[]> {
        try {
            const timeZone = 'Asia/Jakarta';
            // ambil waktu sekarang UTC → konversi ke WIB
            const nowUtc = new Date();
            const nowWib = toZonedTime(nowUtc, timeZone);

            // hitung 7 hari ke belakang dari WIB
            const sevenDaysAgo = subDays(nowWib, 7);
            return await TransactionModel.aggregate([
                {
                    $match: {
                        createdAt: {$gte: sevenDaysAgo}
                    }
                },
                {
                    $group: {
                        _id: "$user", // grouping berdasarkan user
                        income: {
                            $sum: {
                                $cond: [{$eq: ["$type", "Income"]}, "$amount", 0]
                            }
                        },
                        expense: {
                            $sum: {
                                $cond: [{$eq: ["$type", "Expanse"]}, "$amount", 0]
                            }
                        }
                    }
                },
                {
                    $lookup: {
                        from: "users",          // nama collection user
                        localField: "_id",      // _id hasil group = user id
                        foreignField: "_id",    // match ke _id user
                        as: "user"
                    }
                },
                {
                    $unwind: "$user" // biar "user" jadi object, bukan array
                },
                {
                    $project: {
                        _id: 0,
                        userId: "$_id",
                        email: "$user.email",
                        name: "$user.name",
                        income: 1,
                        expense: 1
                    }
                }
            ]) as AggregateTransactionSummary[];
        } catch (error) {
            logger.error(`Error in getWeeklySummaryEmail: ${JSON.stringify(error)}`);
            throw error;
        }
    }

    static async generateWeeklyReports(): Promise<void> {
        try {
            const reports = await TransactionService.getWeeklySummaryEmail();
            // baca templates HTML
            const templatePath = path.join(__dirname, "templates", "weekly_report.html");
            let templateHtml = fs.readFileSync(templatePath, "utf-8");
            for (const data of reports) {
                await new Promise(resolve => setTimeout(resolve, 5000)); // delay 1 detik per email
                const reportHtml = templateHtml
                    .replace("{{name}}", data.name)
                    .replace("{{income}}", formatCurrency(data.income))
                    .replace("{{expense}}", formatCurrency(data.expense))
                    .replace("{{balance}}", formatCurrency(data.income - data.expense));
                // simpan reportHtml ke file
                mailService.sendMail({
                    to: data.email,
                    subject: "Weekly Transaction Summary",
                    html: reportHtml
                })
            }
        } catch (error) {
            logger.error(`Error in generateWeeklyReports: ${JSON.stringify(error)}`);
            throw error;
        }
    }
}

export default TransactionService;