import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import crypto from "crypto";

// Initialize rate limiters
let studentReadLimit = null; // GET students (60/min)
let subjectReadLimit = null; // GET subjects (20/min)
let studentWriteLimit = null; // POST/PUT/DELETE students (10/min)
let subjectWriteLimit = null; // POST/DELETE subjects (5/min)
let authFailureLimit = null; // Strict limiter for failed auth (5/min)

if (
  !process.env.UPSTASH_REDIS_REST_URL ||
  !process.env.UPSTASH_REDIS_REST_TOKEN
) {
  throw new Error(
    "Configurazione server incompleta: Redis non configurato. L'emulazione locale richiede le variabili d'ambiente UPSTASH_.",
  );
}

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

studentReadLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(60, "60 s"),
  prefix: "api-student-read-limit",
});

subjectReadLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(20, "60 s"),
  prefix: "api-subject-read-limit",
});

studentWriteLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, "60 s"),
  prefix: "api-student-write-limit",
});

subjectWriteLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "60 s"),
  prefix: "api-subject-write-limit",
});

authFailureLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "60 s"),
  prefix: "auth-failed-limit",
});

function getClientIp(request) {
  if (request.headers["x-real-ip"]) return request.headers["x-real-ip"];
  if (request.headers["x-vercel-forwarded-for"])
    return request.headers["x-vercel-forwarded-for"];
  let ip = request.headers["x-forwarded-for"] || "unknown";
  if (ip.includes(",")) ip = ip.split(",")[0].trim();
  return ip;
}

/**
 * Shared authentication + rate limiting middleware.
 */
export async function requireAuth(request, response, resource = "general") {
  const ip = getClientIp(request);
  const authCode = process.env.AUTH_CODE;

  // 1. Check if auth is configured
  if (!authCode) {
    response
      .status(500)
      .json({
        error:
          "Configurazione server incompleta (AUTH_CODE mancante). L'emulazione locale richiede l'impostazione delle variabili d'ambiente.",
      });
    return false;
  }

  // 2. Authentication Check (now via Cookie for security)
  const cookies = request.headers.cookie
    ? Object.fromEntries(
        request.headers.cookie.split("; ").map((c) => c.split("=")),
      )
    : {};
  const provided = cookies.auth_code;

  const expectedHash = authCode
    ? crypto.createHash("sha256").update(authCode).digest("hex")
    : null;

  if (!provided || (authCode && provided !== expectedHash)) {
    // failed auth
    if (authFailureLimit) {
      try {
        const { success } = await authFailureLimit.limit(ip);
        if (!success) {
          response.status(429).json({
            error:
              "Troppi tentativi falliti. L'accesso è temporaneamente bloccato.",
          });
          return false;
        }
      } catch (e) {
        console.error("Auth limiter error:", e);
        // FAIL-CLOSED: If Redis is down, block auth attempts for safety
        response
          .status(503)
          .json({
            error: "Servizio temporaneamente non disponibile (Limitatore)",
          });
        return false;
      }
    }
    response
      .status(401)
      .json({ error: "Codice di accesso non valido o sessione scaduta" });
    return false;
  }

  // 3. Authorized User: Select Granular Limiter
  let activeLimiter = null;
  let limitType = "generale";

  if (request.method === "GET") {
    if (resource === "students") {
      activeLimiter = studentReadLimit;
      limitType = "lettura studenti";
    } else if (resource === "subjects") {
      activeLimiter = subjectReadLimit;
      limitType = "lettura materie";
    }
  } else if (resource === "students") {
    activeLimiter = studentWriteLimit;
    limitType = "modifica studenti";
  } else if (resource === "subjects") {
    activeLimiter = subjectWriteLimit;
    limitType = "modifica materie";
  }

  if (activeLimiter) {
    try {
      const { success } = await activeLimiter.limit(ip);
      if (!success) {
        response.status(429).json({
          error: `Limite di richieste (${limitType}) superato. Riprova tra un minuto.`,
        });
        return false;
      }
    } catch (e) {
      console.error("Granular limiter error:", e);
      // FAIL-CLOSED for write operations, maybe allow read?
      // For maximum security in a security audit, we fail closed for everything.
      response
        .status(503)
        .json({
          error: "Servizio temporaneamente non disponibile (Limitatore)",
        });
      return false;
    }
  }

  return true;
}
