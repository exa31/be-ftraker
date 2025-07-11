import jwt from 'jsonwebtoken';
import Config from '../config';
import {payloadJwt} from "../types/jwt"; // jika kamu punya config terpisah

export const generateJwt = (payload: payloadJwt): string => {
    return jwt.sign(payload, Config.JWT_SECRET as string, {
        expiresIn: '1d',
        algorithm: 'HS384'
    });
};

export const verifyJwt = (token: string): payloadJwt | null => {
    try {
        return jwt.verify(token, Config.JWT_SECRET as string) as Record<string, unknown> as payloadJwt;
    } catch (error) {
        console.error('JWT verification failed:', error);
        return null;
    }
};

export const decodeJwt = (token: string): payloadJwt | null => {
    try {
        return jwt.decode(token) as payloadJwt;
    } catch (error) {
        console.error('JWT decoding failed:', error);
        return null;
    }
};
