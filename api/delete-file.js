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

        const { id } = body;

        if (!id) {
            return response.status(400).json({ error: 'Missing file ID' });
        }

        await sql`DELETE FROM archive_files WHERE id = ${id}`;

        return response.status(200).json({ message: 'File deleted successfully' });
    } catch (error) {
        console.error('Error deleting file:', error);
        return response.status(500).json({ error: 'Error deleting file' });
    }
}
