
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Initialize rate limiter: max 5 attempts per minute per IP
let ratelimit = null;
if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    ratelimit = new Ratelimit({
        redis: new Redis({
            url: process.env.UPSTASH_REDIS_REST_URL,
            token: process.env.UPSTASH_REDIS_REST_TOKEN,
        }),
        limiter: Ratelimit.slidingWindow(5, '60 s'), // 5 attempts per 60 seconds
        prefix: 'auth-ratelimit',
    });
}

/**
 * Endpoint to verify the shared access code.
 * POST /api/verify-code { code: "..." }
 */
export default async function handler(request, response) {
    if (request.method !== 'POST') {
        return response.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        // Rate limiting by IP
        if (ratelimit) {
            const ip = request.headers['x-forwarded-for'] || request.headers['x-real-ip'] || 'unknown';
            const { success, remaining } = await ratelimit.limit(ip);

            if (!success) {
                return response.status(429).json({
                    error: "Troppi tentativi. Riprova tra un minuto."
                });
            }
        }

        let body = request.body;
        if (typeof body === 'string') {
            try {
                body = JSON.parse(body);
            } catch (e) {
                return response.status(400).json({ error: "Invalid JSON" });
            }
        }

        const { code } = body;

        if (!code || typeof code !== 'string') {
            return response.status(400).json({ error: "Codice mancante" });
        }

        const authCode = process.env.AUTH_CODE;

        if (!authCode) {
            // No AUTH_CODE configured — always accept (dev mode)
            return response.status(200).json({ success: true });
        }

        if (code !== authCode) {
            return response.status(401).json({ error: "Codice errato" });
        }

        return response.status(200).json({ success: true });
    } catch (error) {
        console.error('verify-code error:', error);
        return response.status(500).json({ error: "Errore interno del server" });
    }
}
