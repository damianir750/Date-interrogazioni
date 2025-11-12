import { neon } from '@netlify/neon';
const sql = neon();

export async function handler(event) {
    try {
        const { name, last_interrogation, subject } = JSON.parse(event.body);
        if (!name || !last_interrogation || !subject) {
            return { statusCode: 400, body: JSON.stringify({ error: "Compila tutti i campi" }) };
        }
        const [student] = await sql`
        INSERT INTO students (name, last_interrogation, subject)
        VALUES (${name}, ${last_interrogation}, ${subject})
        RETURNING *`;
        return { statusCode: 200, body: JSON.stringify(student) };
    } catch (error) {
        return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
    }
}
