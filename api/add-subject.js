import sql from './_db.js';
import { validateSubject } from './_utils.js';

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
        const { name, color } = body;

        const validationErrors = validateSubject(body);
        if (validationErrors.length > 0) {
            return response.status(400).json({ error: validationErrors.join(", ") });
        }

        const [subject] = await sql`
        INSERT INTO subjects (name, color)
        VALUES (${name}, ${color})
        ON CONFLICT (name)
        DO UPDATE SET color = ${color}
        RETURNING *`;

        return response.status(200).json(subject);
    } catch (error) {
        return response.status(500).json({ error: error.message });
    }
}
