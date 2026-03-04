import sql from './_db.js';
import { validateStudent, parseRequestBody } from './_utils.js';
import { requireAuth } from './_auth.js';

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
        const { name, last_interrogation, subject, grades_count } = body;

        const validationErrors = validateStudent(body);
        if (validationErrors.length > 0) {
            return response.status(400).json({ error: validationErrors.join(", ") });
        }

        const [student] = await sql`
        INSERT INTO students (name, last_interrogation, subject, grades_count)
        VALUES (${name}, ${last_interrogation}, ${subject}, ${grades_count || 0})
        RETURNING *`;

        return response.status(200).json(student);
    } catch (error) {
        console.error('add-student error:', error);
        return response.status(500).json({ error: "Errore interno del server" });
    }
}
