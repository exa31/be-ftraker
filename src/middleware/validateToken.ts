import {Context} from "elysia";
import {ErrorResponse} from "../utils/response";
import {verifyJwt} from "../utils/jwt";
import UserModel from "../modules/user/userModel";
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
    const user = verifyJwt(token);
    if (!user) {
        logger.warn("Unauthorized access attempt: Invalid token");
        ctx.set.status = 401;
        throw ErrorResponse<null>(
            "Unauthorized: Invalid token",
            null,
            401
        );
    }
    try {

        const isActiveToken = await UserModel.findOne({
            email: user.email,
            token: {
                $in: [token]
            }
        })
        if (!isActiveToken) {
            logger.warn(`Unauthorized access attempt: Token not found for user ${user.email}`);
            throw ErrorResponse<null>(
                "Unauthorized: Token not found",
                null,
                401
            );
        }
        logger.info(`Token validated successfully for user: ${user.email}`);
        // Attach user information to the context for further use
        return {
            user: {
                ...user,
                id: isActiveToken.id
            }
        }
    } catch (error) {
        logger.error(`Error while checking token in database: ${error}`);
        if (error instanceof Error) {
            ctx.set.status = 500;
            throw ErrorResponse<string>(
                "Internal server error",
                error.message,
                500
            );
        } else {
            logger.warn(`Unauthorized access attempt: Token not found`);
            ctx.set.status = 401;
            throw ErrorResponse<null>(
                "Unauthorized: Token not found",
                null,
                401
            );
        }
    }

}