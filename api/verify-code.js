
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
        prefix: 'auth-failed-limit', // SHARED with _auth.js for brute-force protection
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
        let body = request.body;
        if (typeof body === 'string') {
            try {
                body = JSON.parse(body);
            } catch (e) {
                return response.status(400).json({ error: "Invalid JSON" });
            }
        }

        const { code } = body;
        const authCode = process.env.AUTH_CODE;

        // If code is wrong/missing, we apply the strict "auth-ratelimit"
        if (!code || code !== authCode) {
            if (ratelimit) {
                let ip = request.headers['x-forwarded-for'] || request.headers['x-real-ip'] || 'unknown';
                if (ip.includes(',')) ip = ip.split(',')[0].trim();

                const { success } = await ratelimit.limit(ip);
                if (!success) {
                    return response.status(429).json({ error: "Troppi tentativi falliti. Riprova più tardi." });
                }
            }

            if (!code) return response.status(400).json({ error: "Codice mancante" });

            // Dev mode handling
            if (!authCode && process.env.NODE_ENV === 'development') {
                return response.status(200).json({ success: true });
            }

            return response.status(401).json({ error: "Codice errato" });
        }

        // Configuration check
        if (!authCode && process.env.NODE_ENV !== 'development') {
            return response.status(500).json({ error: "Server misconfigured" });
        }

        return response.status(200).json({ success: true });
    } catch (error) {
        console.error('verify-code error:', error);
        return response.status(500).json({ error: "Errore interno del server" });
    }
}
