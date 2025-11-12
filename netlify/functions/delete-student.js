import { neon } from '@netlify/neon';
const sql = neon();

export async function handler(event) {
    try {
        const { id } = JSON.parse(event.body);
        if (!id) return { statusCode: 400, body: JSON.stringify({ error: "ID mancante" }) };
        await sql`DELETE FROM students WHERE id = ${id}`;
        return { statusCode: 200, body: JSON.stringify({ success: true }) };
    } catch (error) {
        return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
    }
}
