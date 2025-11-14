import dotenv from "dotenv";

dotenv.config();

class Config {
    public static readonly PORT = process.env.PORT || 3003;
    public static readonly MONGO_URI = process.env.MONGO_DB_URL;
    public static readonly MODE = process.env.NODE_ENV === 'development' ? 'development' : 'production';
    public static readonly JWT_SECRET = process.env.SECRET_KEY;
    public static readonly GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
    public static readonly GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
    public static readonly REDIS_URL = process.env.REDIS_URL;
    public static readonly SMTP_HOST = process.env.SMTP_HOST;
    public static readonly SMTP_PORT = process.env.SMTP_PORT;
    public static readonly SMTP_USER = process.env.SMTP_USER;
    public static readonly SMTP_PASS = process.env.SMTP_PASS;
}

export default Config;