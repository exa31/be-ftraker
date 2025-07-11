import {Elysia} from "elysia";
import "./databases"
import UserRoutes from "./modules/user/userRoutes";
import Config from "./config";
import logger from "./utils/logger";

const app = new Elysia().onStart(
    (server) => {
        if (Config.MODE === 'development') {
            console.log("Available routes:");
            server.routes.forEach(route => {
                console.log(`- ${route.method} ${route.path}`);
            });
        }
    }
).onRequest((ctx) => {
    // Middleware to log request details
    if (Config.MODE === 'development') {
        logger.info(`Incoming request: ${ctx.request.method} ${ctx.request.url.split("/").slice(3).join("/")}`);
    }
})
    .group('/auth/v1', (group) =>
        group.use(UserRoutes)
    ).group(
        '/api/v1',
        (group) => group
    )
    .listen(3000);

console.log(
    `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
