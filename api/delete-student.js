import sql from './_db.js';
import { requireAuth } from './_auth.js';

export default async function handler(request, response) {
    if (request.method !== 'POST') {
        return response.status(405).json({ error: 'Method Not Allowed' });
    }

    if (!await requireAuth(request, response)) return;

    try {
        let body = request.body;
        if (typeof body === 'string') {
            try {
                body = JSON.parse(body);
            } catch (e) {
                return response.status(400).json({ error: "Invalid JSON" });
            }
        }
        const { id } = body;
        if (!id) return response.status(400).json({ error: "ID mancante" });

        await sql`DELETE FROM students WHERE id = ${id}`;
        return response.status(200).json({ success: true });
    } catch (error) {
        console.error('delete-student error:', error);
        return response.status(500).json({ error: "Errore interno del server" });
    }
}
