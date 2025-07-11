import {PreContext} from "elysia";
import Config from "../config";
import logger from "../utils/logger";

export const logrequest = (ctx: PreContext<{ decorator: {}; store: {}; derive: {}; resolve: {} }>) => {
    // Middleware to log request details
    if (Config.MODE === 'development') {
        logger.info(`Request: ${ctx.request.method} ${ctx.request.url.split('/').slice(3).join('/')}`);
    }
}