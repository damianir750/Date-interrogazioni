import sql from './_db.js';
import { requireAuth } from './_auth.js';

export default async function handler(request, response) {
    if (request.method !== 'GET') {
        return response.status(405).json({ error: 'Method Not Allowed' });
    }

    if (!requireAuth(request, response)) return;

    // response.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate'); // Disabled for consistency

    try {
        const subjects = await sql`SELECT * FROM subjects ORDER BY name ASC`;
        return response.status(200).json(subjects);
    } catch (error) {
        console.error('get-subjects error:', error);
        return response.status(500).json({ error: "Errore interno del server" });
    }
}
