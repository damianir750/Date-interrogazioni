import sql from './_db.js';

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
        const { name } = body;

        if (!name) {
            return response.status(400).json({ error: "Nome materia richiesto" });
        }

        // Elimina la materia
        await sql`DELETE FROM subjects WHERE name = ${name}`;

        return response.status(200).json({ success: true });

    } catch (error) {
        // Check for Postgres Foreign Key Violation (23503)
        if (error.code === '23503') {
            return response.status(400).json({
                error: "Non puoi eliminare una materia con studenti associati"
            });
        }
        return response.status(500).json({ error: error.message });
    }
}
