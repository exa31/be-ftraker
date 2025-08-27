import {Context} from "elysia";
import {ErrorResponse} from "../utils/response";
import {verifyJwt} from "../utils/jwt";
import logger from "../utils/logger";

export const validateToken = async (ctx: Context) => {
    // Middleware to validate JWT token
    logger.info(`Validating token for request: ${ctx.request.method} ${ctx.request.url.split('/').slice(3).join('/')}`);
    const token = ctx.request.headers.get('Authorization')?.split(' ')[1];
    if (!token) {
        logger.warn("Unauthorized access attempt: No token provided");
        ctx.set.status = 401;
        throw ErrorResponse<null>(
            "Unauthorized: No token provided",
            null,
            401
        )
    }
    // Assuming you have a function to verify the token
    const user = verifyJwt(token, true, 'access');
    if (!user) {
        logger.warn("Unauthorized access attempt: Invalid token");
        ctx.set.status = 401;
        throw ErrorResponse<null>(
            "Unauthorized: Invalid token",
            null,
            401
        );
    }
    return {
        user: {
            ...user,
            id: user.id_user
        }
    }
}