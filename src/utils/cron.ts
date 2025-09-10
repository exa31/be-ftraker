import cron from "node-cron";
import winston from "winston";
import transactionService from "../modules/transaction/transactionService";

// cron job: tiap Senin jam 08:00 WIB
cron.schedule("0 8 * * 1", async () => {
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

    _logger.info("Running weekly report cron job");
    await transactionService.generateWeeklyReports();
}, {
    timezone: "Asia/Jakarta"
});

// test cron job tiap 5 detik
// cron.schedule("*/5 * * * * *", async () => {
//     const _logger = winston.createLogger({
//         level: 'info', // kalau prod, minimal warn
//         format: winston.format.combine(
//             winston.format.timestamp(),
//             winston.format.printf(({level, message, timestamp}) => {
//                 const stack = new Error().stack?.split("\n")[3]?.trim() || "";
//                 return `[${timestamp}] ${level.toUpperCase()} ${stack} - ${typeof message === "string" ? message : JSON.stringify(message)}`;
//             })
//         ),
//         transports: [
//             // console logger
//             new winston.transports.Console({
//                 format: winston.format.simple(),
//             }),
//         ],
//     });
//
//     _logger.info("Running test cron job every 5 seconds");
// }, {
//     timezone: "Asia/Jakarta"
// });