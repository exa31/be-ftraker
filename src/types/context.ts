import {Context} from "elysia";

export type AuthContext = Context & {
    user: {
        id: string;
        email: string;
        name: string;
    }
}