import * as mongoose from "mongoose";
import Config from "../config"
import logger from "../utils/logger";

(() => {
    mongoose.connect(Config.MONGO_URI as string, {
        minPoolSize: 1,
        maxPoolSize: 10,
        retryReads: true,
        retryWrites: true,
        serverSelectionTimeoutMS: 5000,
    })
        .then(() => {
            logger.info("MongoDB connected successfully");
        })
        .catch((error) => {
            logger.error(`MongoDB connection error: ${error.message}`);
            process.exit(1); // Keluar dari proses jika koneksi gagal
        });
})();
