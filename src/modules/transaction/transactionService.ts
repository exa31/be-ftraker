import {Request, Response} from "express";
import logger from "../../utils/logger";
import {formatErrorValidation, validate} from "../../utils/validation";
import {createTransactionBodySchema, getTransactionQuerySchema, updateTransactionBodySchema} from "./transactionSchema";
import {ErrorResponse, SuccessResponse} from "../../utils/response";
import TransactionModel from "./transactionModel";
import useSelectedViewPeriode from "../../utils/selectedViewPeriode";
import {ZodError} from "zod";
import mongoose from "mongoose";

class TransactionService {

    static async getTransactions(req: Request, res: Response) {
        try {
            validate(req.query, getTransactionQuerySchema);

            const {view} = req.query as any;
            const user = req.user!;
            const {lastPeriode, currentPeriode} = useSelectedViewPeriode(view);

            if (view === "All") {
                const all = await TransactionModel
                    .find({user: user.id_user})
                    .sort({createdAt: -1});

                return res.status(200).json(SuccessResponse({
                    current: all,
                    last: []
                }, "All transactions retrieved successfully", 200));
            }

            const current = await TransactionModel
                .find({user: user.id_user})
                .gte("createdAt", currentPeriode().start)
                .lte("createdAt", currentPeriode().end)
                .sort({createdAt: -1});

            const last = await TransactionModel
                .find({user: user.id_user})
                .gte("createdAt", lastPeriode().start)
                .lte("createdAt", lastPeriode().end)
                .sort({createdAt: -1});

            return res.status(200).json(SuccessResponse({
                current,
                last
            }, "Transactions retrieved successfully", 200));

        } catch (error) {
            logger.error(error);

            if (error instanceof ZodError) {
                const message = formatErrorValidation(error);
                return res.status(400).json(ErrorResponse("Validation error", message, 400));
            }

            return res.status(500).json(ErrorResponse("Internal server error", (error as Error).message, 500));
        }
    }

    static async createTransaction(req: Request, res: Response, session: mongoose.ClientSession) {
        validate(req.body, createTransactionBodySchema);

        const {amount, type, description, createdAt} = req.body;
        const user = req.user!;

        const transaction = new TransactionModel({
            user: user.id_user,
            amount,
            type,
            description,
            createdAt
        });

        await transaction.save({session});

        return res.status(201).json(SuccessResponse(transaction, "Transaction created successfully", 201));
    }

    static async updateTransaction(req: Request, res: Response, session: mongoose.ClientSession) {
        validate(req.body, updateTransactionBodySchema);

        const {amount, type, description, createdAt} = req.body;
        const {transactionId} = req.params;
        const user = req.user!;

        const transaction = await TransactionModel.findOne({_id: transactionId, user: user.id_user});

        if (!transaction) {
            return res.status(404).json(ErrorResponse("Not Found", "Transaction not found", 404));
        }

        transaction.amount = amount;
        transaction.type = type;
        transaction.description = description;
        transaction.createdAt = createdAt ? new Date(createdAt) : transaction.createdAt;

        await transaction.save({session});

        return res.status(200).json(SuccessResponse(transaction, "Transaction updated successfully", 200));
    }

    static async deleteTransaction(req: Request, res: Response, session: mongoose.ClientSession) {
        const {transactionId} = req.params;
        const user = req.user!;

        const transaction = await TransactionModel.findOneAndDelete(
            {_id: transactionId, user: user.id_user},
            {session}
        );

        if (!transaction) {
            return res.status(404).json(ErrorResponse("Not Found", "Transaction not found", 404));
        }

        return res.status(200).json(SuccessResponse(null, "Transaction deleted successfully", 200));
    }
}

export default TransactionService;
