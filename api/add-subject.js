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
        const { name, color } = request.body;

        if (!name || !color) {
            return response.status(400).json({ error: "Nome e colore richiesti" });
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
