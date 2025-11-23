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
        const { id, name } = body;

        if (!id || !name) {
            return response.status(400).json({ error: "ID e nome sono richiesti" });
        }

        const [student] = await sql`
        UPDATE students 
        SET name = ${name}
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
