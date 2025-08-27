import jwt from 'jsonwebtoken';
import Config from '../config';
import {payloadJwt} from "../types/jwt";
import {config} from "zod"; // jika kamu punya config terpisah

export const generateJwt = (payload: payloadJwt): string => {
    if (payload.type === 'refresh') {
        return jwt.sign(payload, Config.JWT_SECRET as string, {
            expiresIn: '30d'
        });
    }
    return jwt.sign(payload, Config.JWT_SECRET as string, {
        expiresIn: '1h',
        algorithm: 'HS384'
    });
};

export const verifyJwt = (token: string, checkType: boolean, type: 'access' | 'refresh'): payloadJwt | null => {
    try {
        if (checkType) {
            const decoded = jwt.verify(token, Config.JWT_SECRET as string) as Record<string, unknown> as payloadJwt;
            if (decoded.type !== type) {
                return null;
            }
            return decoded;
        }
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
