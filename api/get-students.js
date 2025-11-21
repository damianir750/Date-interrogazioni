import { neon } from '@neondatabase/serverless';


if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not defined");
}
const sql = neon(process.env.DATABASE_URL);

export default async function handler(request, response) {
    if (request.method !== 'GET') {
        return response.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const students = await sql`SELECT * FROM students ORDER BY last_interrogation ASC`;
        return response.status(200).json(students);
    } catch (error) {
        return response.status(500).json({ error: error.message });
    }
}
