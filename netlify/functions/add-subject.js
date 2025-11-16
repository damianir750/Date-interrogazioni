import { neon } from '@netlify/neon';
const sql = neon();

export async function handler(event) {
    try {
        const { name, color } = JSON.parse(event.body);
        if (!name || !color) {
            return {
                statusCode: 400,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ error: "Nome e colore richiesti" })
            };
        }

        const [subject] = await sql`
        INSERT INTO subjects (name, color)
        VALUES (${name}, ${color})
        ON CONFLICT (name)
        DO UPDATE SET color = ${color}
        RETURNING *`;

        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(subject)
        };
    } catch (error) {
        return {
            statusCode: 500,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: error.message })
        };
    }
}
