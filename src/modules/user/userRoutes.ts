import {Elysia} from "elysia";
import UserService from "./userService";
import {wrappingDbTransaction} from "../../utils/db";

const UserRoutes = new Elysia()
    .post('/login', async (ctx) => {
        return await wrappingDbTransaction(ctx, UserService.login);
    })
    .post('/register', async (ctx) => {
        return await wrappingDbTransaction(ctx, UserService.register);
    })
    .post('/login-with-google', async (ctx) => {
        return await wrappingDbTransaction(ctx, UserService.loginWithGoogle);
    })
    .post('/logout', async (ctx) => {
        return await wrappingDbTransaction(ctx, UserService.logout);
    })
    .post('/refresh', async (ctx) => {
        return await wrappingDbTransaction(ctx, UserService.refreshToken);
    })

export default UserRoutes;




