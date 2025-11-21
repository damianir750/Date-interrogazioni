import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

export default async function handler(request, response) {
    if (request.method !== 'GET') {
        return response.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const subjects = await sql`SELECT * FROM subjects ORDER BY name ASC`;
        return response.status(200).json(subjects);
    } catch (error) {
        return response.status(500).json({ error: error.message });
    }
}
