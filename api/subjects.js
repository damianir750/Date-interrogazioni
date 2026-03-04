import sql from './_db.js';
import { requireAuth } from './_auth.js';
import {
    validateSubject,
    validateDeleteSubject,
    parseRequestBody
} from './_utils.js';

export default async function handler(request, response) {
    if (!await requireAuth(request, response)) return;

    try {
        switch (request.method) {
            case 'GET':
                return await handleGet(request, response);
            case 'POST':
                return await handlePost(request, response);
            case 'DELETE':
                return await handleDelete(request, response);
            default:
                return response.status(405).json({ error: 'Method Not Allowed' });
        }
    } catch (error) {
        console.error('subjects-api error:', error);
        return response.status(500).json({ error: "Errore interno del server" });
    }
}

async function handleGet(request, response) {
    const subjects = await sql`SELECT * FROM subjects ORDER BY name ASC`;
    return response.status(200).json(subjects);
}

async function handlePost(request, response) {
    const body = parseRequestBody(request);
    if (!body) return response.status(400).json({ error: "Invalid JSON" });

    const errors = validateSubject(body);
    if (errors.length > 0) return response.status(400).json({ error: errors.join(", ") });

    const { name, color } = body;
    const [subject] = await sql`
        INSERT INTO subjects (name, color)
        VALUES (${name}, ${color})
        ON CONFLICT (name)
        DO UPDATE SET color = ${color}
        RETURNING *`;
    return response.status(200).json(subject);
}

async function handleDelete(request, response) {
    const body = parseRequestBody(request);
    if (!body) return response.status(400).json({ error: "Invalid JSON" });

    const errors = validateDeleteSubject(body);
    if (errors.length > 0) return response.status(400).json({ error: errors.join(", ") });

    const { name } = body;
    try {
        await sql`DELETE FROM subjects WHERE name = ${name}`;
        return response.status(200).json({ success: true });
    } catch (error) {
        if (error.code === '23503') {
            return response.status(400).json({
                error: "Non puoi eliminare una materia con studenti associati"
            });
        }
        throw error;
    }
}
