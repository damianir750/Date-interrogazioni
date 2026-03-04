import sql from './_db.js';
import { requireAuth } from './_auth.js';
import {
    validateStudent,
    validateUpdateStudent,
    validateDeleteStudent,
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
            case 'PUT':
                return await handlePut(request, response);
            case 'DELETE':
                return await handleDelete(request, response);
            default:
                return response.status(405).json({ error: 'Method Not Allowed' });
        }
    } catch (error) {
        console.error('students-api error:', error);
        return response.status(500).json({ error: "Errore interno del server" });
    }
}

async function handleGet(request, response) {
    const students = await sql`SELECT * FROM students ORDER BY grades_count ASC, last_interrogation ASC`;
    return response.status(200).json(students);
}

async function handlePost(request, response) {
    const body = parseRequestBody(request);
    if (!body) return response.status(400).json({ error: "Invalid JSON" });

    const errors = validateStudent(body);
    if (errors.length > 0) return response.status(400).json({ error: errors.join(", ") });

    const { name, last_interrogation, subject, grades_count } = body;
    const [student] = await sql`
        INSERT INTO students (name, last_interrogation, subject, grades_count)
        VALUES (${name}, ${last_interrogation}, ${subject}, ${grades_count || 0})
        RETURNING *`;
    return response.status(200).json(student);
}

async function handlePut(request, response) {
    const body = parseRequestBody(request);
    if (!body) return response.status(400).json({ error: "Invalid JSON" });

    const errors = validateUpdateStudent(body);
    if (errors.length > 0) return response.status(400).json({ error: errors.join(", ") });

    const { id, name, grades_count, last_interrogation } = body;
    const [student] = await sql`
        UPDATE students 
        SET 
            name = COALESCE(${name ?? null}, name),
            grades_count = COALESCE(${grades_count ?? null}, grades_count),
            last_interrogation = COALESCE(${last_interrogation ?? null}, last_interrogation)
        WHERE id = ${id}
        RETURNING *`;

    if (!student) return response.status(404).json({ error: "Studente non trovato" });
    return response.status(200).json(student);
}

async function handleDelete(request, response) {
    const body = parseRequestBody(request);
    if (!body) return response.status(400).json({ error: "Invalid JSON" });

    const errors = validateDeleteStudent(body);
    if (errors.length > 0) return response.status(400).json({ error: errors.join(", ") });

    const { id } = body;
    await sql`DELETE FROM students WHERE id = ${id}`;
    return response.status(200).json({ success: true });
}
