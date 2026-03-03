
/**
 * Shared authentication middleware.
 * Compares the x-auth-code header against the AUTH_CODE env variable.
 * Returns true if authorized, false if not (and sends 401 response).
 */
export function requireAuth(request, response) {
    const authCode = process.env.AUTH_CODE;

    if (!authCode) {
        // If AUTH_CODE is not configured, allow all requests (dev mode)
        return true;
    }

    const provided = request.headers['x-auth-code'];

    if (!provided || provided !== authCode) {
        response.status(401).json({ error: "Codice di accesso non valido" });
        return false;
    }

    return true;
}
