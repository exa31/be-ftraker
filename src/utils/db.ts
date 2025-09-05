import mongoose, {Error} from "mongoose";
import logger from "./logger";
import zod from "zod";
import {formatErrorValidation} from "./validation";
import {ErrorResponse} from "./response";
import {Context} from "elysia";
import {ResponseModel} from "../types/response";
import {MongoServerError} from "mongodb";

export const wrappingDbTransaction = async <TCTX extends Context, T>(ctx: TCTX, fn: (ctx: TCTX, tx: mongoose.ClientSession) => Promise<ResponseModel<T>>): Promise<ResponseModel<T> | ResponseModel<Record<string, string>> | ResponseModel<string>> => {
    const session = await mongoose.startSession({defaultTimeoutMS: 5000});
    session.startTransaction();
    try {
        const result = await fn(ctx, session);
        await session.commitTransaction();
        return result;
    } catch (error) {
        await session.abortTransaction();
        logger.error(`${JSON.stringify(error)}`);
        if (error instanceof zod.ZodError) {
            const message = formatErrorValidation(error);
            ctx.set.status = 400;
            return ErrorResponse<Record<string, string>>("Validation error", message, 400);
        } else if (error instanceof MongoServerError && error.code === 11000) {
            const field = Object.keys(error.keyPattern)[0];
            const value = error.keyValue[field];

            ctx.set.status = 409;
            return ErrorResponse<string>(
                `${field} already exists`,
                `The value '${value}' for field '${field}' already exists.`,
                409
            );
        }
        ctx.set.status = 500;
        return ErrorResponse<string>("Internal server error", (error as Error).message, 500);
    } finally {
        await session.endSession();
    }
}