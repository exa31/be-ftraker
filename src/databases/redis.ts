import {createClient} from "redis";
import Config from "../config";
import logger from "../utils/logger";

const clientRedis = createClient({
    socket: {
        reconnectStrategy: retries => {
            if (retries > 10) return new Error("Redis reconnect failed");
            logger.info("Redis redis connecting...");
            return Math.min(retries * 50, 500); // retry tiap 50ms → max 500ms
        },
        keepAlive: true, // jaga koneksi tetap hidup
    },
    url: Config.REDIS_URL as string,
});
(async () => {
    try {
        clientRedis.on("error", (err) => {
            logger.error(`Redis Client Error: ${err}`);
        });
        clientRedis.on("connect", () => {
            logger.info("Redis client is connecting...");
        });
        clientRedis.on("ready", () => {
            logger.info("Redis client is ready to use");
        });
        clientRedis.on("end", () => {
            logger.warn("Redis connection has been closed");
        })
        await clientRedis.connect();
        logger.info("Connected to Redis successfully");
    } catch (error) {
        logger.error(`Redis connection error: ${(error as Error).message}`);
    }

})();


const getClientRedis = async () => {
    try {
        if (!clientRedis.isOpen) {
            logger.info("Redis client is opened");
            await clientRedis.connect()
            return clientRedis
        } else {
            return clientRedis
        }
    } catch (error) {
        logger.error(`Redis connection error: ${(error as Error).message}`);
        return null;
    }
}

export default getClientRedis;