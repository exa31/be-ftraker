import jwt from "jsonwebtoken";

export interface payloadJwt extends jwt.JwtPayload {
    email: string;
    name: string;
}