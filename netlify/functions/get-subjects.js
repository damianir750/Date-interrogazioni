import { neon } from '@netlify/neon';
const sql = neon();

export async function handler() {
    try {
        const subjects = await sql`SELECT * FROM subjects ORDER BY name ASC`;
        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(subjects)
        };
    } catch (error) {
        return {
            statusCode: 500,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: error.message })
        };
    }
}
