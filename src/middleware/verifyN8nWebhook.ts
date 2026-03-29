import { Request, Response, NextFunction } from 'express';
import { ErrorResponse } from '../../utils/response';
import { verifyHmacSignature } from '../../utils/hmac';
import Config from '../../config';
import logger from '../../utils/logger';

/**
 * Middleware to verify N8N webhook integrity
 * - Validates API key from header
 * - Verifies HMAC signature from header
 */
export function verifyN8nWebhook(req: Request, res: Response, next: NextFunction) {
    try {
        // 1. Verify API Key
        const apiKey = req.headers['x-api-key'] as string;
        if (!apiKey || apiKey !== Config.N8N_API_KEY) {
            logger.warn('Invalid N8N API Key attempt', {
                provided: apiKey ? 'provided' : 'missing',
                ip: req.ip
            });
            return res.status(401).json(ErrorResponse('Unauthorized', 'Invalid API key', 401));
        }

        // 2. Verify HMAC Signature
        const signature = req.headers['x-webhook-signature'] as string;
        if (!signature) {
            logger.warn('Missing webhook signature header', { ip: req.ip });
            return res.status(401).json(ErrorResponse('Unauthorized', 'Missing webhook signature', 401));
        }

        // Get raw body (Express middleware must use express.raw() for this to work)
        const rawBody = JSON.stringify(req.body);

        // Verify signature
        const isValid = verifyHmacSignature(rawBody, signature, Config.N8N_WEBHOOK_SECRET);
        if (!isValid) {
            logger.warn('Invalid webhook HMAC signature', { ip: req.ip });
            return res.status(401).json(ErrorResponse('Unauthorized', 'Invalid webhook signature', 401));
        }

        logger.info('N8N webhook signature verified successfully');
        next();
    } catch (error) {
        logger.error('Webhook verification error', error);
        return res.status(500).json(ErrorResponse('Internal server error', (error as Error).message, 500));
    }
}

export default verifyN8nWebhook;
