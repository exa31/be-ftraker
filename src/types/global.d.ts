import "express";

declare module "express-serve-static-core" {
    interface Request {
        user?: {
            id_user: string;
            email: string;
            type: "access" | "refresh";
            name: string
        };
    }
}
