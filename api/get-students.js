import sql from './_db.js';
import { requireAuth } from './_auth.js';

export default async function handler(request, response) {
    if (request.method !== 'GET') {
        return response.status(405).json({ error: 'Method Not Allowed' });
    }

    if (!await requireAuth(request, response)) return;

    // response.setHeader('Cache-Control', 's-maxage=10, stale-while-revalidate'); // Disabled for consistency

    try {
        const students = await sql`SELECT * FROM students ORDER BY grades_count ASC, last_interrogation ASC`;
        return response.status(200).json(students);
    } catch (error) {
        console.error('get-students error:', error);
        return response.status(500).json({ error: "Errore interno del server" });
    }
}
