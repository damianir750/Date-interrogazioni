import sql from './_db.js';

export default async function handler(request, response) {
    if (request.method !== 'GET') {
        return response.status(405).json({ error: 'Method Not Allowed' });
    }

    // response.setHeader('Cache-Control', 's-maxage=10, stale-while-revalidate'); // Disabled for consistency

    try {
        const students = await sql`SELECT * FROM students ORDER BY grades_count ASC, last_interrogation ASC`;
        return response.status(200).json(students);
    } catch (error) {
        return response.status(500).json({ error: error.message });
    }
}
