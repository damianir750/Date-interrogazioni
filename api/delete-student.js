import sql from './_db.js';
import { requireAuth } from './_auth.js';
import { validateDeleteStudent, parseRequestBody } from './_utils.js';

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

        const validationErrors = validateDeleteStudent(body);
        if (validationErrors.length > 0) {
            return response.status(400).json({ error: validationErrors.join(", ") });
        }

        const { id } = body;

        await sql`DELETE FROM students WHERE id = ${id}`;
        return response.status(200).json({ success: true });
    } catch (error) {
        console.error('delete-student error:', error);
        return response.status(500).json({ error: "Errore interno del server" });
    }
}
