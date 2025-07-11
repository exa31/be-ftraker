import {Elysia} from "elysia";
import UserService from "./userService";

const UserRoutes = new Elysia()
    .post('/login', async (ctx) => {
        return await UserService.login(ctx);
    })
    .post('/register', async (ctx) => {
        return await UserService.register(ctx);
    })
    .post('/login-with-google', async (ctx) => {
        return await UserService.loginWithGoogle(ctx);
    })
    .post('/logout', async (ctx) => {
        return await UserService.logout(ctx);
    })

export default UserRoutes;




