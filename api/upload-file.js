import { neon } from '@neondatabase/serverless';

export default async function handler(request, response) {
    if (request.method !== 'POST') {
        return response.status(405).json({ error: 'Method not allowed' });
    }

    const sql = neon(process.env.DATABASE_URL);

    try {
        let body = request.body;
        if (typeof body === 'string') {
            body = JSON.parse(body);
        }

        const { name, type, size, content } = body;

        if (!name || !content) {
            return response.status(400).json({ error: 'Missing required fields' });
        }

        if (size > 4 * 1024 * 1024) {
            return response.status(413).json({ error: 'File too large (max 4MB)' });
        }

        // --- THE FIX IS HERE ---
        // 1. We assume 'content' is a Base64 string from the frontend (e.g. FileReader result)
        // 2. We verify if it has the Data URI prefix (e.g., "data:image/png;base64,") and strip it
        const base64Data = content.includes(';base64,') 
            ? content.split(';base64,')[1] 
            : content;

        // 3. Convert the Base64 string into a binary Buffer
        const buffer = Buffer.from(base64Data, 'base64');
        // -----------------------

        // Pass the Buffer to SQL. The neon driver handles the BYTEA formatting automatically.
        await sql`
            INSERT INTO archive_files (name, type, size, content)
            VALUES (${name}, ${type}, ${size}, ${buffer})
        `;

        return response.status(201).json({ message: 'File uploaded successfully' });
    } catch (error) {
        console.error('Error uploading file:', error);
        return response.status(500).json({ error: 'Error uploading file' });
    }
}
