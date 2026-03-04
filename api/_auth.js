
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Initialize rate limiters
let ratelimit = null; // General API limiter
let authFailureLimit = null; // Strict limiter for failed auth

if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    const redis = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });

    ratelimit = new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(30, '60 s'), // 30 requests per minute
        prefix: 'api-ratelimit',
    });

    authFailureLimit = new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(5, '60 s'), // 5 failed attempts per minute
        prefix: 'auth-failed-limit', // Shared across all endpoints
    });
}

function getClientIp(request) {
    let ip = request.headers['x-forwarded-for'] || request.headers['x-real-ip'] || 'unknown';
    if (ip.includes(',')) ip = ip.split(',')[0].trim();
    return ip;
}

/**
 * Shared authentication + rate limiting middleware.
 */
/**
 * Shared authentication + rate limiting middleware.
 */
export async function requireAuth(request, response) {
    const ip = getClientIp(request);
    const authCode = process.env.AUTH_CODE;
    const provided = request.headers['x-auth-code'];

    // 1. Check if auth is configured
    if (!authCode) {
        if (process.env.NODE_ENV === 'development') return true;
        response.status(500).json({ error: "Configurazione server incompleta (AUTH_CODE mancante)" });
        return false;
    }

    // 2. Authentication Check
    if (!provided || provided !== authCode) {
        // failed auth
        if (authFailureLimit) {
            try {
                const { success } = await authFailureLimit.limit(ip);
                if (!success) {
                    response.status(429).json({
                        error: "Troppi tentativi falliti. L'accesso è temporaneamente bloccato per questo IP."
                    });
                    return false;
                }
            } catch (e) {
                console.error('Auth limiter error:', e);
            }
        }
        response.status(401).json({ error: "Codice di accesso non valido" });
        return false;
    }

    // 3. Authorized User: Apply General DoS Protection (30 req/min)
    if (ratelimit) {
        try {
            const { success } = await ratelimit.limit(ip);
            if (!success) {
                response.status(429).json({
                    error: "Limite di richieste superato. Rallenta un attimo!"
                });
                return false;
            }
        } catch (e) {
            console.error('Rate limiter error:', e);
        }
    }

    return true;
}
