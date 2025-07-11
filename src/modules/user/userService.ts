import UserModel from "./userModel";
import {Context} from "elysia";
import zod from "zod";
import {formatErrorValidation, validate} from "../../utils/validation";
import {loginBodySchema, loginWithGoogleBodySchema, registerBodySchema} from "./userSchema";
import logger from "../../utils/logger";
import {ErrorResponse, SuccessResponse} from "../../utils/response";
import {ResponseModel} from "../../types/response";
import {comparePassword, encryptPassword} from "../../utils/bcrypt";
import {generateJwt} from "../../utils/jwt";
import {OAuth2Client} from "google-auth-library";
import Config from "../../config";
import {ResponseAuth} from "../../types/user";

class UserService {

    static async login(ctx: Context): Promise<ResponseModel<ResponseAuth | null | string | Record<string, string>>> {
        try {
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
            const token = generateJwt({
                email: user.email,
                name: user.name
            });
            user.token.push(token);
            await user.save();
            logger.info(`User ${user.email} logged in successfully`);
            ctx.set.status = 200;
            return SuccessResponse<ResponseAuth>({
                    token,
                },
                "Login successful",
                200
            );
        } catch (error) {
            logger.error(`Error in login handler: ${error}`);
            if (error instanceof zod.ZodError) {
                const message = formatErrorValidation(error);
                ctx.set.status = 400;
                return ErrorResponse<Record<string, string>>("Validation error", message, 400)

            }
            ctx.set.status = 500;
            return ErrorResponse<string>("Internal server error", (error as Error).message, 500);
        }
    }

    static async register(ctx: Context): Promise<ResponseModel<ResponseAuth | Record<string, string> | null | string>> {
        try {
            // Implement registration logic here
            validate(ctx.body, registerBodySchema)
            const {email, password, name} = ctx.body as zod.infer<typeof registerBodySchema>;

            const hashedPassword = await encryptPassword(password);

            const newUser = new UserModel({
                email,
                password: hashedPassword,
                name
            })
            await newUser.save();
            const token = generateJwt({
                email: newUser.email,
                name: newUser.name
            });
            newUser.token.push(token);
            logger.info(`User ${email} registered successfully`);
            ctx.set.status = 201;
            return SuccessResponse<ResponseAuth>({
                    token
                },
                "User registered successfully",
                201
            );
        } catch (error) {
            logger.error(`Error in register handler: ${error}`);
            if (error instanceof zod.ZodError) {
                const message = formatErrorValidation(error);
                ctx.set.status = 400;
                return ErrorResponse<Record<string, string>>("Validation error", message, 400);
            } else if ((error as Error).message.includes("duplicate key")) {
                ctx.set.status = 409;
                return ErrorResponse<string>("Email already exists", (error as Error).message, 409);
            }
            ctx.set.status = 500;
            return ErrorResponse<string>("Internal server error", (error as Error).message, 500);
        }
    }

    static async loginWithGoogle(ctx: Context): Promise<ResponseModel<ResponseAuth | Record<string, string> | null | string>> {
        try {
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
                const token = generateJwt({
                    email: existingUser.email,
                    name: existingUser.name
                });
                existingUser.token.push(token);
                await existingUser.save();
                logger.info(`User ${email} logged in with Google successfully`);
                ctx.set.status = 200;
                return SuccessResponse<ResponseAuth>({
                    token
                }, "User already exists", 200);
            } else {
                ctx.set.status = 404;
                return ErrorResponse<null>("User does not exist", null, 404);
            }
        } catch (error) {
            logger.error(`Error in loginWithGoogle handler: ${error}`);
            if (error instanceof zod.ZodError) {
                const message = formatErrorValidation(error);
                ctx.set.status = 400;
                return ErrorResponse<Record<string, string>>("Validation error", message, 400);
            }
            ctx.set.status = 500;
            return ErrorResponse<string>("Internal server error", (error as Error).message, 500);
        }
    }

}


export default UserService;
