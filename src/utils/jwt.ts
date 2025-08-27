import jwt from 'jsonwebtoken';
import Config from '../config';
import {payloadJwt} from "../types/jwt";

export const generateJwt = (payload: payloadJwt): string => {
    if (payload.type === 'refresh') {
        return jwt.sign(payload, Config.JWT_SECRET as string, {
            expiresIn: '30d',
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

export const checkExpiredToken = (token: string): { expired: boolean; willExpireSoon: boolean } => {
    try {
        const decoded = jwt.verify(token, Config.JWT_SECRET as string) as payloadJwt

        // waktu sekarang (detik)
        const now = Math.floor(Date.now() / 1000)
        // 3 hari ke depan
        const threeDays = 3 * 24 * 60 * 60
        if (!decoded.exp) {
            return {expired: false, willExpireSoon: false}
        }
        const timeLeft = decoded.exp - now

        return {
            expired: false,
            willExpireSoon: timeLeft <= threeDays
        }
    } catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
            return {expired: true, willExpireSoon: false}
        }
        console.error('JWT verification failed:', error)
        return {expired: false, willExpireSoon: false}
    }
}