import UserModel from "./userModel";
import {Context} from "elysia";
import zod from "zod";
import {validate} from "../../utils/validation";
import {loginBodySchema, loginWithGoogleBodySchema, registerBodySchema} from "./userSchema";
import logger from "../../utils/logger";
import {ErrorResponse, SuccessResponse} from "../../utils/response";
import {ResponseModel} from "../../types/response";
import {comparePassword, encryptPassword} from "../../utils/bcrypt";
import {decodeJwt, generateJwt} from "../../utils/jwt";
import {OAuth2Client} from "google-auth-library";
import Config from "../../config";
import {ResponseAuth} from "../../types/user";
import clientRedis from "../../databases/redis";
import mongoose from "mongoose";

class UserService {

    static async login(ctx: Context, session: mongoose.ClientSession): Promise<ResponseModel<ResponseAuth | null>> {
        validate(ctx.body, loginBodySchema)
        const {email, password} = ctx.body as zod.infer<typeof loginBodySchema>;

        const user = await UserModel.findOne({email});
        if (!user) {
            ctx.set.status = 401;
            return ErrorResponse<null>("Email or Password is wrong", null, 401)
        }

        // Here you would typically compare the password with a hashed version
        if (!await comparePassword(password, user.password)) {
            ctx.set.status = 401;
            return ErrorResponse<null>("Email or Password is wrong", null, 401);
        }

        // Generate a token or session here
        const accessToken = generateJwt({
            email: user.email,
            name: user.name,
            type: 'access',
        });
        const refreshToken = generateJwt({
            email: user.email,
            name: user.name,
            type: 'refresh',
        });
        user.token.push(refreshToken);
        await user.save({session});
        clientRedis.setEx(`refreshToken:${refreshToken}`, 60 * 60 * 24 * 30, refreshToken); // 30 days expiration
        logger.info(`User ${user.email} logged in successfully`);
        ctx.set.status = 200;
        return SuccessResponse<ResponseAuth>({
                accessToken,
                refreshToken
            },
            "Login successful",
            200
        );
    }

    static async register(ctx: Context, session: mongoose.ClientSession): Promise<ResponseModel<ResponseAuth>> {
        // Implement registration logic here
        validate(ctx.body, registerBodySchema)
        const {email, password, name} = ctx.body as zod.infer<typeof registerBodySchema>;

        const hashedPassword = await encryptPassword(password);

        const newUser = new UserModel({
            email,
            password: hashedPassword,
            name
        })
        await newUser.save({session});
        const accessToken = generateJwt({
            email: newUser.email,
            name: newUser.name,
            type: 'access',
        });
        const refreshToken = generateJwt({
            email: newUser.email,
            name: newUser.name,
            type: 'refresh',
        });
        newUser.token.push(refreshToken);
        await newUser.save({session});
        clientRedis.setEx(`refreshToken:${refreshToken}`, 60 * 60 * 24 * 30, refreshToken); // 30 days expiration
        logger.info(`User ${email} registered successfully`);
        ctx.set.status = 201;
        return SuccessResponse<ResponseAuth>({
                refreshToken,
                accessToken
            },
            "User registered successfully",
            201
        );
    }

    static async loginWithGoogle(ctx: Context, session: mongoose.ClientSession): Promise<ResponseModel<ResponseAuth | null>> {
        validate(ctx.body, loginWithGoogleBodySchema)
        const {credential} = ctx.body as zod.infer<typeof loginWithGoogleBodySchema>;

        const client = new OAuth2Client(Config.GOOGLE_CLIENT_ID)

        const ticket = await client.verifyIdToken({
            idToken: credential,
            audience: Config.GOOGLE_CLIENT_ID
        });

        const {email, email_verified} = ticket.getPayload() as decodedTicketPayload

        if (!email_verified) {
            ctx.set.status = 401;
            return ErrorResponse<null>("Email not verified", null, 401);
        }
        const existingUser = await UserModel.findOne({email});

        if (existingUser) {
            const accessToken = generateJwt({
                email: existingUser.email,
                name: existingUser.name,
                type: 'access',
            });
            const refreshToken = generateJwt({
                email: existingUser.email,
                name: existingUser.name,
                type: 'refresh',
            });
            existingUser.token.push(refreshToken);
            await existingUser.save({session});
            clientRedis.setEx(`refreshToken:${refreshToken}`, 60 * 60 * 24 * 30, refreshToken); // 30 days expiration
            logger.info(`User ${email} logged in with Google successfully`);
            ctx.set.status = 200;
            return SuccessResponse<ResponseAuth>({
                accessToken,
                refreshToken
            }, "User already exists", 200);
        } else {
            ctx.set.status = 404;
            return ErrorResponse<null>("User does not exist", null, 404);
        }
    }

    static async logout(ctx: Context, session: mongoose.ClientSession): Promise<ResponseModel<string | null>> {
        const {token} = ctx.body as { token: string };
        const decoded = decodeJwt(token)
        if (!decoded || !decoded.email) {
            ctx.set.status = 401;
            return ErrorResponse<null>("Invalid token", null, 401);
        }
        const user = await UserModel.findOneAndUpdate(
            {email: decoded.email},
            {$pull: {token: token}},
            {new: true, session}
        );
        if (!user) {
            ctx.set.status = 404;
            return ErrorResponse<null>("User not found", null, 404);
        }
        logger.info(`User ${decoded.email} logged out successfully`);
        ctx.set.status = 200;
        return SuccessResponse<null>(null, "Logged out successfully", 200);
    }

}


export default UserService;
