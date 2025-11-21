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
        const { name } = request.body;

        if (!name) {
            return response.status(400).json({ error: "Nome materia richiesto" });
        }

        // Verifica se ci sono studenti con questa materia
        const students = await sql`
            SELECT COUNT(*) as count 
            FROM students 
            WHERE subject = ${name}
        `;

        if (students[0].count > 0) {
            return response.status(400).json({
                error: "Non puoi eliminare una materia con studenti associati"
            });
        }

        // Elimina la materia
        await sql`DELETE FROM subjects WHERE name = ${name}`;

        return response.status(200).json({ success: true });

    } catch (error) {
        return response.status(500).json({ error: error.message });
    }
}
