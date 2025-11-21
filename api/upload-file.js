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

        // Basic size check (redundant if frontend checks, but good for safety)
        // 4.5MB limit for Vercel serverless payload, so we check for 4MB to be safe
        if (size > 4 * 1024 * 1024) {
            return response.status(413).json({ error: 'File too large (max 4MB)' });
        }

        await sql`
      INSERT INTO archive_files (name, type, size, content)
      VALUES (${name}, ${type}, ${size}, ${content})
    `;

        return response.status(201).json({ message: 'File uploaded successfully' });
    } catch (error) {
        console.error('Error uploading file:', error);
        return response.status(500).json({ error: 'Error uploading file' });
    }
}
