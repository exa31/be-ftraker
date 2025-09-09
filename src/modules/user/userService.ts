import UserModel from "./userModel";
import {Context} from "elysia";
import zod from "zod";
import {validate} from "../../utils/validation";
import {loginBodySchema, loginWithGoogleBodySchema, registerBodySchema} from "./userSchema";
import logger from "../../utils/logger";
import {ErrorResponse, SuccessResponse} from "../../utils/response";
import {ResponseModel} from "../../types/response";
import {comparePassword, encryptPassword} from "../../utils/bcrypt";
import {checkExpiredToken, decodeJwt, generateJwt} from "../../utils/jwt";
import {OAuth2Client} from "google-auth-library";
import Config from "../../config";
import {ResponseAuth} from "../../types/user";
import mongoose from "mongoose";
import tokenModel from "../token/tokenModel";
import getClientRedis from "../../databases/redis";

class UserService {

    static async login(ctx: Context, session: mongoose.ClientSession): Promise<ResponseModel<ResponseAuth | null>> {
        validate(ctx.body, loginBodySchema)
        const {email, password} = ctx.body as zod.infer<typeof loginBodySchema>;
        const user = await UserModel.findOne({email});
        const clientRedis = await getClientRedis();
        if (!clientRedis) {
            ctx.set.status = 500;
            return ErrorResponse<null>("Redis connection error", null, 500);
        }
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
            id_user: user.id
        });
        const refreshToken = generateJwt({
            email: user.email,
            name: user.name,
            type: 'refresh',
            id_user: user.id
        });


        await new tokenModel({
            token: refreshToken,
            id_user: user._id,
            expireAt: new Date(Date.now() + 60 * 60 * 24 * 30 * 1000) // 30 days
        }).save({session})


        await clientRedis.setEx(`refreshToken:${refreshToken}`, 60 * 60 * 24 * 30, refreshToken); // 30 days expiration
        ctx.cookie.refreshToken.set({
            value: refreshToken,
            expires: new Date(Date.now() + 60 * 60 * 24 * 30 * 1000), // 30 hari
            httpOnly: true,
            sameSite: 'lax',
            secure: true, // true kalau di https
            path: '/', // biasanya set path juga
        });
        logger.info(`User ${user.email} logged in successfully`);
        ctx.set.status = 200;
        return SuccessResponse<ResponseAuth>({
                accessToken,
                refreshToken,
            },
            "Login successful",
            200
        );
    }

    static async register(ctx: Context, session: mongoose.ClientSession): Promise<ResponseModel<ResponseAuth | null>> {
        // Implement registration logic here
        validate(ctx.body, registerBodySchema)
        const {email, password, name} = ctx.body as zod.infer<typeof registerBodySchema>;
        const clientRedis = await getClientRedis();
        if (!clientRedis) {
            ctx.set.status = 500;
            return ErrorResponse<null>("Redis connection error", null, 500);
        }
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
            id_user: newUser.id
        });
        const refreshToken = generateJwt({
            email: newUser.email,
            name: newUser.name,
            type: 'refresh',
            id_user: newUser.id
        });
        await newUser.save({session})
        await new tokenModel({
            token: refreshToken,
            id_user: newUser.id,
            expireAt: new Date(Date.now() + 60 * 60 * 24 * 30 * 1000) // 30 days
        }).save({session})


        ctx.cookie.refreshToken.set({
            value: refreshToken,
            expires: new Date(Date.now() + 60 * 60 * 24 * 30 * 1000), // 30 hari
            httpOnly: true,
            sameSite: 'lax',
            secure: true, // true kalau di https
            path: '/', // biasanya set path juga
        })
        await clientRedis.setEx(`refreshToken:${refreshToken}`, 60 * 60 * 24 * 30, refreshToken); // 30 days expiration
        logger.info(`User ${email} registered successfully`);
        ctx.set.status = 201;
        return SuccessResponse<ResponseAuth>({
                accessToken,
                refreshToken,
            },
            "User registered successfully",
            201
        );
    }

    static async loginWithGoogle(ctx: Context, session: mongoose.ClientSession): Promise<ResponseModel<ResponseAuth | null>> {
        validate(ctx.body, loginWithGoogleBodySchema)
        const {credential} = ctx.body as zod.infer<typeof loginWithGoogleBodySchema>;
        const clientRedis = await getClientRedis();
        if (!clientRedis) {
            ctx.set.status = 500;
            return ErrorResponse<null>("Redis connection error", null, 500);
        }

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
                id_user: existingUser.id
            });
            const refreshToken = generateJwt({
                email: existingUser.email,
                name: existingUser.name,
                type: 'refresh',
                id_user: existingUser.id
            });
            await new tokenModel({
                token: refreshToken,
                id_user: existingUser.id,
                expireAt: new Date(Date.now() + 60 * 60 * 24 * 30 * 1000) // 30 days
            }).save({session})

            ctx.cookie.refreshToken.set({
                value: refreshToken,
                expires: new Date(Date.now() + 60 * 60 * 24 * 30 * 1000), // 30 hari
                httpOnly: true,
                sameSite: 'lax',
                secure: true, // true kalau di https
                path: '/', // biasanya set path juga
            })
            await clientRedis.setEx(`refreshToken:${refreshToken}`, 60 * 60 * 24 * 30, refreshToken); // 30 days expiration
            logger.info(`User ${email} logged in with Google successfully`);
            ctx.set.status = 200;
            return SuccessResponse<ResponseAuth>({
                accessToken,
                refreshToken,
            }, "User already exists", 200);
        } else {
            ctx.set.status = 404;
            return ErrorResponse<null>("User does not exist", null, 404);
        }
    }

    static async logout(ctx: Context, session: mongoose.ClientSession): Promise<ResponseModel<string | null>> {
        let {token} = ctx.body as { token: string };
        if (!token) {
            const tokenFromCookie = ctx.cookie.refreshToken.value;
            if (tokenFromCookie) {
                token = tokenFromCookie;
            } else {
                ctx.set.status = 401;
                return ErrorResponse<null>("Refresh token not found", null, 401);
            }

        }
        const clientRedis = await getClientRedis();
        if (!clientRedis) {
            ctx.set.status = 500;
            return ErrorResponse<null>("Redis connection error", null, 500);
        }
        const decoded = decodeJwt(token)
        if (!decoded || !decoded.email) {
            ctx.set.status = 401;
            return ErrorResponse<null>("Invalid token", null, 401);
        }

        await tokenModel.deleteOne({token}, {session})
        ctx.cookie.refreshToken.remove()
        await clientRedis.del(`refreshToken:${token}`);
        logger.info(`User ${decoded.email} logged out successfully`);
        ctx.set.status = 200;
        return SuccessResponse<null>(null, "Logged out successfully", 200);
    }

    static async refreshToken(ctx: Context, session: mongoose.ClientSession): Promise<ResponseModel<ResponseAuth | null>> {
        let refreshToken = ctx.cookie.refreshToken.value;
        if (!refreshToken) {
            refreshToken = ctx.headers.authorization?.split(' ')[1];
        }
        const clientRedis = await getClientRedis();
        if (!clientRedis) {
            ctx.set.status = 500;
            return ErrorResponse<null>("Redis connection error", null, 500);
        }
        if (!refreshToken) {
            ctx.set.status = 401;
            return ErrorResponse<null>("Refresh token not found", null, 401);
        }
        const isExist = await clientRedis.get(`refreshToken:${refreshToken}`);
        if (!isExist) {
            const tokenInDb = await this.getRefreshTokenFromDb(refreshToken);
            if (!tokenInDb) {
                ctx.set.status = 401;
                return ErrorResponse<null>("Invalid refresh token", null, 401);
            } else {
                await clientRedis.setEx(`refreshToken:${refreshToken}`, 60 * 60 * 24 * 30, refreshToken); // 30 days expiration
            }
        }
        const {expired, willExpireSoon} = checkExpiredToken(refreshToken);
        const payload = decodeJwt(refreshToken);
        if (!payload || !payload.email) {
            ctx.set.status = 401;
            return ErrorResponse<null>("Invalid refresh token", null, 401);
        }
        if (expired || willExpireSoon) {
            const newRefreshToken = generateJwt({
                email: payload.email,
                name: payload.name,
                type: 'refresh',
                id_user: payload.id_user
            });
            const newAccessToken = generateJwt({
                email: payload.email,
                name: payload.name,
                type: 'access',
                id_user: payload.id_user
            });
            await tokenModel.updateOne({token: refreshToken}, {
                token: newRefreshToken,
                expireAt: new Date(Date.now() + 60 * 60 * 24 * 30 * 1000)
            }, {session});
            await Promise.all([
                clientRedis.del(`refreshToken:${refreshToken}`),
                clientRedis.setEx(`refreshToken:${newRefreshToken}`, 60 * 60 * 24 * 30, newRefreshToken) // 30 days expiration
            ])
            ctx.cookie.refreshToken.set({
                value: newRefreshToken,
                expires: new Date(Date.now() + 60 * 60 * 24 * 30 * 1000), // 30 hari
                httpOnly: true,
                sameSite: 'lax',
                secure: true, // true kalau di https
            })
            logger.info(`Refresh and access token for user ${payload.email} refreshed successfully`);
            ctx.set.status = 200;
            return SuccessResponse<ResponseAuth>({
                accessToken: newAccessToken,
                refreshToken: newRefreshToken
            }, "Token refreshed successfully", 200);
        } else {
            const newAccessToken = generateJwt({
                email: payload.email,
                name: payload.name,
                type: 'access',
                id_user: payload.id_user
            });
            logger.info(`Access token for user ${payload.email} refreshed successfully`);
            ctx.set.status = 200;
            return SuccessResponse<ResponseAuth>({
                accessToken: newAccessToken,
                refreshToken: refreshToken
            }, "Token refreshed successfully", 200);
        }
    }

    private static async getRefreshTokenFromDb(token: string): Promise<string | null> {
        const storedToken = await tokenModel.findOne({token});
        return storedToken ? storedToken.token : null;
    }

}


export default UserService;
