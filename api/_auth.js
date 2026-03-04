
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Initialize rate limiter: 30 requests per minute per IP for general API usage
let ratelimit = null;
if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    ratelimit = new Ratelimit({
        redis: new Redis({
            url: process.env.UPSTASH_REDIS_REST_URL,
            token: process.env.UPSTASH_REDIS_REST_TOKEN,
        }),
        limiter: Ratelimit.slidingWindow(30, '60 s'), // 30 requests per 60 seconds
        prefix: 'api-ratelimit',
    });
}

/**
 * Shared authentication + rate limiting middleware.
 * 1. Rate limits by IP (30 req/min)
 * 2. Compares the x-auth-code header against the AUTH_CODE env variable.
 * Returns true if authorized, false if not (and sends error response).
 */
export async function requireAuth(request, response) {
    // Rate limiting by IP
    if (ratelimit) {
        let ip = request.headers['x-forwarded-for'] || request.headers['x-real-ip'] || 'unknown';
        if (ip.includes(',')) ip = ip.split(',')[0].trim(); // Handle multiple proxies

        try {
            const { success } = await ratelimit.limit(ip);
            if (!success) {
                response.status(429).json({ error: "Troppe richieste. Riprova tra un minuto." });
                return false;
            }
        } catch (e) {
            // If Redis is down, don't block requests — just skip rate limiting
            console.error('Rate limiter error:', e);
        }
    }

    // Auth check
    const authCode = process.env.AUTH_CODE;

    if (!authCode) {
        if (process.env.NODE_ENV === 'development') {
            return true;
        }
        response.status(500).json({ error: "Configurazione server incompleta (AUTH_CODE mancante)" });
        return false;
    }

    const provided = request.headers['x-auth-code'];

    if (!provided || provided !== authCode) {
        response.status(401).json({ error: "Codice di accesso non valido" });
        return false;
    }

    return true;
}
