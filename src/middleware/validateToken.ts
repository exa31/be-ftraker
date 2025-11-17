import {verifyJwt} from "../utils/jwt";
import {ErrorResponse} from "../utils/response";
import logger from "../utils/logger";
import {NextFunction, Request, Response} from "express";

export const validateToken = (req: Request, res: Response, next: NextFunction) => {
    logger.info(
        `Validating token for request: ${req.method} ${req.originalUrl}`
    );

    const authHeader = req.headers["authorization"];
    const token = authHeader?.split(" ")[1];

    if (!token) {
        logger.warn("Unauthorized access attempt: No token provided");

        return res.status(400).json(
            ErrorResponse(
                "Unauthorized: No token provided",
                null,
                400
            )
        );
    }

    try {
        const user = verifyJwt(token, true, "access");

        if (!user) {
            logger.warn("Unauthorized access attempt: Invalid token");

            return res.status(401).json(
                ErrorResponse(
                    "Unauthorized: Invalid token",
                    null,
                    401
                )
            );
        }

        req.user = {
            ...user,
        };

        next();
    } catch (err) {
        logger.error("JWT verification error", err);

        return res.status(401).json(
            ErrorResponse(
                "Unauthorized: Invalid token",
                null,
                401
            )
        );
    }
};
