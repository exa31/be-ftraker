import mongoose, {Error} from "mongoose";
import logger from "./logger";
import zod from "zod";
import {formatErrorValidation} from "./validation";
import {ErrorResponse} from "./response";
import type {NextFunction, Request, Response} from "express";

export const wrappingDbTransaction =
    <T = unknown>(
        fn: (
            req: Request,
            res: Response,
            session: mongoose.ClientSession
        ) => Promise<T>
    ) => {
        return async (req: Request, res: Response, next: NextFunction) => {
            const session = await mongoose.startSession({defaultTimeoutMS: 5000});
            session.startTransaction();

            try {
                const result = await fn(req, res, session);

                await session.commitTransaction();
                return result;
            } catch (error: any) {
                await session.abortTransaction();
                logger.error(error);

                if (error instanceof zod.ZodError) {
                    const message = formatErrorValidation(error);
                    return res
                        .status(400)
                        .json(ErrorResponse("Validation error", message, 400));
                }
                if (error.code === 11000) {
                    const field = Object.keys(error.keyPattern ?? {})[0];
                    const value = error.keyValue?.[field];

                    return res.status(409).json(
                        ErrorResponse(
                            `${field} already exists`,
                            `The value '${value}' for field '${field}' already exists.`,
                            409
                        )
                    );
                }

                return res.status(500).json(
                    ErrorResponse(
                        "Internal server error",
                        (error as Error).message,
                        500
                    )
                );
            } finally {
                await session.endSession();
            }
        };
    };
