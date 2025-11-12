import { neon } from '@netlify/neon';
const sql = neon();

export async function handler(event) {
    try {
        const { name, last_interrogation } = JSON.parse(event.body);
        if (!name || !last_interrogation) {
            return { statusCode: 400, body: JSON.stringify({ error: "Missing name or date" }) };
        }

        const [student] = await sql`
        INSERT INTO students (name, last_interrogation)
        VALUES (${name}, ${last_interrogation})
        RETURNING *`;

        return { statusCode: 200, body: JSON.stringify(student) };
    } catch (error) {
        return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
    }
}
