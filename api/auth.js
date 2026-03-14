import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import crypto from "crypto";
import { requireJson, parseRequestBody } from "./_utils.js";

// Initialize rate limiters
let apiLimit = null; // General limit (30/min)
let authFailureLimit = null; // Failure limit (5/min)

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

apiLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(30, "60 s"),
  prefix: "api-ratelimit",
});

authFailureLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "60 s"),
  prefix: "auth-failed-limit",
});

/**
 * Endpoint to verify the shared access code.
 */
export default async function handler(request, response) {
  if (request.method !== "POST") {
    return response.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    let ip =
      request.headers["x-real-ip"] ||
      request.headers["x-vercel-forwarded-for"] ||
      request.headers["x-forwarded-for"] ||
      "unknown";
    if (ip.includes(",")) ip = ip.split(",")[0].trim();

    if (!requireJson(request))
      return response
        .status(415)
        .json({
          error:
            "Unsupported Media Type (Content-Type must be application/json)",
        });

    // 1. Parse body
    let body;
    try {
      body = parseRequestBody(request);
    } catch (e) {
      if (e.message === "Payload Too Large")
        return response.status(413).json({ error: "Payload Too Large" });
    }

    if (!body) return response.status(400).json({ error: "Invalid JSON" });
    const { code } = body;
    const authCode = process.env.AUTH_CODE;

    // 2. Auth Check
    if (!authCode) {
      return response
        .status(500)
        .json({
          error:
            "Configurazione server incompleta (AUTH_CODE mancante). Impostare le variabili d'ambiente.",
        });
    }

    const isMatch = code === authCode;

    if (!isMatch) {
      // 3. WRONG CODE: Apply strict failure limit
      if (authFailureLimit) {
        const { success } = await authFailureLimit.limit(ip);
        if (!success) {
          return response
            .status(429)
            .json({ error: "Troppi tentativi falliti. Riprova più tardi." });
        }
      }
      if (!code) return response.status(400).json({ error: "Codice mancante" });
      return response.status(401).json({ error: "Codice errato" });
    }

    if (apiLimit) {
      const { success } = await apiLimit.limit(ip);
      if (!success) {
        return response
          .status(429)
          .json({
            error: "Limite di richieste superato. Per favore rallenta.",
          });
      }
    }

    // 4. Set HttpOnly Cookie (Security)
    const isProd = process.env.NODE_ENV === "production";
    // Session lasts 7 days
    const maxAge = 60 * 60 * 24 * 7;
    const hashedCode = authCode
      ? crypto.createHash("sha256").update(authCode).digest("hex")
      : "";
    response.setHeader(
      "Set-Cookie",
      `auth_code=${hashedCode}; HttpOnly; Path=/; Max-Age=${maxAge}; SameSite=Strict${isProd ? "; Secure" : ""}`,
    );

    return response.status(200).json({ success: true });
  } catch (error) {
    console.error("auth error:", error);
    return response.status(500).json({ error: "Errore interno del server" });
  }
}
