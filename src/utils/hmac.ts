import crypto from 'crypto';

/**
 * Generate HMAC signature for webhook verification
 * @param data - The raw body data
 * @param secret - The webhook secret
 * @returns HMAC signature in hex format
 */
export function generateHmacSignature(data: string, secret: string): string {
    return crypto
        .createHmac('sha256', secret)
        .update(data)
        .digest('hex');
}

/**
 * Verify webhook HMAC signature
 * @param data - The raw body data
 * @param signature - The signature from webhook header
 * @param secret - The webhook secret
 * @returns true if signature is valid
 */
export function verifyHmacSignature(data: string, signature: string, secret: string): boolean {
    const expectedSignature = generateHmacSignature(data, secret);
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
}

export default { generateHmacSignature, verifyHmacSignature };
