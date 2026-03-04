import sql from './_db.js';
import { requireAuth } from './_auth.js';
import { validateDeleteSubject, parseRequestBody } from './_utils.js';

export default async function handler(request, response) {
    if (request.method !== 'POST') {
        return response.status(405).json({ error: 'Method Not Allowed' });
    }

    if (!await requireAuth(request, response)) return;

    try {
        const body = parseRequestBody(request);
        if (!body) {
            return response.status(400).json({ error: "Invalid JSON" });
        }

        const validationErrors = validateDeleteSubject(body);
        if (validationErrors.length > 0) {
            return response.status(400).json({ error: validationErrors.join(", ") });
        }

        const { name } = body;

        // Elimina la materia
        await sql`DELETE FROM subjects WHERE name = ${name}`;

        return response.status(200).json({ success: true });

    } catch (error) {
        // Check for Postgres Foreign Key Violation (23503)
        if (error.code === '23503') {
            return response.status(400).json({
                error: "Non puoi eliminare una materia con studenti associati"
            });
        }
        console.error('delete-subject error:', error);
        return response.status(500).json({ error: "Errore interno del server" });
    }
}
