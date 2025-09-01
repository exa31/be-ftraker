import {Elysia} from "elysia";
import "./databases/mongodb"
import UserRoutes from "./modules/user/userRoutes";
import TransactionRoutes from "./modules/transaction/transactionRoutes";
import {logrouting} from "./middleware/logrouting";
import {logrequest} from "./middleware/logrequest";
import {validateToken} from "./middleware/validateToken";

const app = new Elysia().onStart(
    (server) => {
        logrouting(server);
    }
).onRequest((ctx) => {
    logrequest(ctx);
})
    .group('/auth/v1', (group) =>
        group.use(UserRoutes)
    ).group(
        '/api/v1',
        (group) => group
            .resolve(
                (ctx) => {
                    return validateToken(ctx)
                }
            )
            .use(TransactionRoutes)
    )
    .all(
        '*',
        (ctx) => {
            ctx.set.status = 404;
            return {message: 'Route not found'};
        },
    )
    .listen(3000);

console.log(
    `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
