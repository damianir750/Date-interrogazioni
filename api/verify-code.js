
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
