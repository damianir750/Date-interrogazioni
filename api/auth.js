
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Initialize rate limiters
let apiLimit = null; // General limit (30/min)
let authFailureLimit = null; // Failure limit (5/min)

if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    const redis = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });

    apiLimit = new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(30, '60 s'),
        prefix: 'api-ratelimit',
    });

    authFailureLimit = new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(5, '60 s'),
        prefix: 'auth-failed-limit',
    });
}

/**
 * Endpoint to verify the shared access code.
 */
export default async function handler(request, response) {
    if (request.method !== 'POST') {
        return response.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        let ip = request.headers['x-forwarded-for'] || request.headers['x-real-ip'] || 'unknown';
        if (ip.includes(',')) ip = ip.split(',')[0].trim();

        // 1. Parse body
        let body = request.body;
        if (typeof body === 'string') {
            try { body = JSON.parse(body); } catch (e) { return response.status(400).json({ error: "Invalid JSON" }); }
        }
        const { code } = body;
        const authCode = process.env.AUTH_CODE;

        // 2. Auth Check
        const isMatch = authCode ? (code === authCode) : (process.env.NODE_ENV === 'development');

        if (!isMatch) {
            // 3. WRONG CODE: Apply strict failure limit
            if (authFailureLimit) {
                const { success } = await authFailureLimit.limit(ip);
                if (!success) {
                    return response.status(429).json({ error: "Troppi tentativi falliti. Riprova più tardi." });
                }
            }
            if (!code) return response.status(400).json({ error: "Codice mancante" });
            return response.status(401).json({ error: "Codice errato" });
        }

        // 4. CORRECT CODE: Apply general rate limit (DoS protection)
        if (apiLimit) {
            const { success } = await apiLimit.limit(ip);
            if (!success) {
                return response.status(429).json({ error: "Limite di richieste superato. Per favore rallenta." });
            }
        }

        if (!authCode && process.env.NODE_ENV !== 'development') {
            return response.status(500).json({ error: "Configurazione server incompleta" });
        }

        return response.status(200).json({ success: true });
    } catch (error) {
        console.error('auth error:', error);
        return response.status(500).json({ error: "Errore interno del server" });
    }
}
