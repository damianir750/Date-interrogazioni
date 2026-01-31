import sql from './_db.js';
import { validateUpdateStudent } from './_utils.js';

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
        const { id, name, grades_count, last_interrogation } = body;

        const validationErrors = validateUpdateStudent(body);
        if (validationErrors.length > 0) {
            return response.status(400).json({ error: validationErrors.join(", ") });
        }

        const [student] = await sql`
        UPDATE students 
        SET 
            name = COALESCE(${name ?? null}, name),
            grades_count = COALESCE(${grades_count ?? null}, grades_count),
            last_interrogation = COALESCE(${last_interrogation ?? null}, last_interrogation)
        WHERE id = ${id}
        RETURNING *`;

        if (!student) {
            return response.status(404).json({ error: "Studente non trovato" });
        }

        return response.status(200).json(student);
    } catch (error) {
        return response.status(500).json({ error: error.message });
    }
}
