
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Initialize rate limiters
let studentReadLimit = null;  // GET students (60/min)
let subjectReadLimit = null;  // GET subjects (20/min)
let studentWriteLimit = null; // POST/PUT/DELETE students (10/min)
let subjectWriteLimit = null; // POST/DELETE subjects (5/min)
let authFailureLimit = null;  // Strict limiter for failed auth (5/min)

if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    const redis = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });

    studentReadLimit = new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(60, '60 s'),
        prefix: 'api-student-read-limit',
    });

    subjectReadLimit = new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(20, '60 s'),
        prefix: 'api-subject-read-limit',
    });

    studentWriteLimit = new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(10, '60 s'),
        prefix: 'api-student-write-limit',
    });

    subjectWriteLimit = new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(5, '60 s'),
        prefix: 'api-subject-write-limit',
    });

    authFailureLimit = new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(5, '60 s'),
        prefix: 'auth-failed-limit',
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
export async function requireAuth(request, response, resource = 'general') {
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

    // 3. Authorized User: Select Granular Limiter
    let activeLimiter = null;
    let limitType = "generale";

    if (request.method === 'GET') {
        if (resource === 'students') {
            activeLimiter = studentReadLimit;
            limitType = "lettura studenti";
        } else if (resource === 'subjects') {
            activeLimiter = subjectReadLimit;
            limitType = "lettura materie";
        }
    } else if (resource === 'students') {
        activeLimiter = studentWriteLimit;
        limitType = "modifica studenti";
    } else if (resource === 'subjects') {
        activeLimiter = subjectWriteLimit;
        limitType = "modifica materie";
    }

    if (activeLimiter) {
        try {
            const { success } = await activeLimiter.limit(ip);
            if (!success) {
                response.status(429).json({
                    error: `Limite di richieste (${limitType}) superato. Riprova tra un minuto.`
                });
                return false;
            }
        } catch (e) {
            console.error('Granular limiter error:', e);
        }
    }

    return true;
}
