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
        const { name, last_interrogation, subject } = request.body;

        if (!name || !last_interrogation || !subject) {
            return response.status(400).json({ error: "Compila tutti i campi" });
        }

        const [student] = await sql`
        INSERT INTO students (name, last_interrogation, subject)
        VALUES (${name}, ${last_interrogation}, ${subject})
        RETURNING *`;

        return response.status(200).json(student);
    } catch (error) {
        return response.status(500).json({ error: error.message });
    }
}
