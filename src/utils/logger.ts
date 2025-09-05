import winston from 'winston';
import path from 'path';
import fs from 'fs';

const logDir = 'logs';

// cek environment
const isProd = process.env.NODE_ENV === 'production';
const isVercel = process.env.VERCEL === '1';

// buat folder log kalau bukan vercel
if (!isVercel && !fs.existsSync(logDir)) {
    fs.mkdirSync(logDir);
}

const logger = winston.createLogger({
    level: isProd ? 'warn' : 'info', // kalau prod, minimal warn
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.printf(({level, message, timestamp}) => {
            const stack = new Error().stack?.split("\n")[3]?.trim() || "";
            return `[${timestamp}] ${level.toUpperCase()} ${stack} - ${typeof message === "string" ? message : JSON.stringify(message)}`;
        })
    ),
    transports: [
        // file logger (kalau bukan vercel)
        ...(!isVercel ? [
            new winston.transports.File({filename: path.join(logDir, 'error.log'), level: 'error'}),
            new winston.transports.File({filename: path.join(logDir, 'combined.log')}),
        ] : []),

        // console logger
        new winston.transports.Console({
            format: winston.format.simple(),
        }),
    ],
});

export default logger;
