import {PreContext} from "elysia";
import winston from "winston";

export const logrequest = (ctx: PreContext<{ decorator: {}; store: {}; derive: {}; resolve: {} }>) => {
    // Middleware to log request details

    const _logger = winston.createLogger({
        level: 'info', // kalau prod, minimal warn
        format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.printf(({level, message, timestamp}) => {
                const stack = new Error().stack?.split("\n")[3]?.trim() || "";
                return `[${timestamp}] ${level.toUpperCase()} ${stack} - ${typeof message === "string" ? message : JSON.stringify(message)}`;
            })
        ),
        transports: [
            // console logger
            new winston.transports.Console({
                format: winston.format.simple(),
            }),
        ],
    });

    _logger.info(`Request: ${ctx.request.method} ${ctx.request.url.split('/').slice(3).join('/')}`);
}