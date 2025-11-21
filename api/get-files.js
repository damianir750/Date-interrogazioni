import { neon } from '@neondatabase/serverless';

export default async function handler(request, response) {
    const sql = neon(process.env.DATABASE_URL);

    try {
        // Fetch only metadata, not the full content (which is heavy)
        const files = await sql`
      SELECT id, name, type, size, upload_date 
      FROM archive_files 
      ORDER BY upload_date DESC
    `;

        return response.status(200).json(files);
    } catch (error) {
        console.error('Error fetching files:', error);
        return response.status(500).json({ error: 'Error fetching files' });
    }
}
