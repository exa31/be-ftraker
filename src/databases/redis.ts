import {createClient} from "redis";
import Config from "../config";
import logger from "../utils/logger";

const clientRedis = createClient({
    socket: {
        connectTimeout: 10000,
        reconnectStrategy: (retries) => {
            if (retries > 5) {
                logger.error("Max retries reached for Redis connection");
                return new Error("Max retries reached");
            }
            logger.warn(`Redis connection retry attempt: ${retries}`);
            return Math.min(retries * 1000, 5000); // Exponential backoff with a max delay of 5 seconds
        }
    },
    url: Config.REDIS_URL as string,
});
(async () => {
    try {
        await clientRedis.connect();
        logger.info("Connected to Redis successfully");
    } catch (error) {
        logger.error(`Redis connection error: ${(error as Error).message}`);
        process.exit(1); // Exit the process if connection fails
    }

})();


export default clientRedis;