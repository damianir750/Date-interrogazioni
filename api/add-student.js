import { neon } from '@neondatabase/serverless';


if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not defined");
}
const sql = neon(process.env.DATABASE_URL);

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

        if (!name || !last_interrogation || !subject) {
            return response.status(400).json({ error: "Compila tutti i campi" });
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
