class Config {
    public static readonly PORT = 8080;
    public static readonly MONGO_URI = process.env.MONGO_DB_URL;
    public static readonly MODE = process.env.NODE_ENV === 'development' ? 'development' : 'production';
    public static readonly JWT_SECRET = process.env.SECRET_KEY;
    public static readonly GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
    public static readonly GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
    public static readonly REDIS_URL = process.env.REDIS_URL;
}

export default Config;