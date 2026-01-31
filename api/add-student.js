import sql from './_db.js';
import { validateStudent } from './_utils.js';

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
        return response.status(500).json({ error: error.message });
    }
}
