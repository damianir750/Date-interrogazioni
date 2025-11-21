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
        const { id } = request.body;
        if (!id) return response.status(400).json({ error: "ID mancante" });

        await sql`DELETE FROM students WHERE id = ${id}`;
        return response.status(200).json({ success: true });
    } catch (error) {
        return response.status(500).json({ error: error.message });
    }
}
