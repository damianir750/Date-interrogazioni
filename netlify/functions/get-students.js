import { neon } from '@netlify/neon';
const sql = neon();

export async function handler() {
    try {
        const students = await sql`SELECT * FROM students ORDER BY last_interrogation ASC`;
        return { statusCode: 200, body: JSON.stringify(students) };
    } catch (error) {
        return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
    }
}
