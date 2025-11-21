import { neon } from '@neondatabase/serverless';

export default async function handler(request, response) {
    const sql = neon(process.env.DATABASE_URL);
    const { id } = request.query;

    if (!id) {
        return response.status(400).json({ error: 'Missing file ID' });
    }

    try {
        const files = await sql`
      SELECT name, type, content 
      FROM archive_files 
      WHERE id = ${id}
    `;

        if (files.length === 0) {
            return response.status(404).json({ error: 'File not found' });
        }

        const file = files[0];

        // Decode Base64 content
        const buffer = Buffer.from(file.content, );

        // Set headers for download
        response.setHeader('Content-Type', file.type || 'application/octet-stream');
        response.setHeader('Content-Disposition', `attachment; filename="${file.name}"`);
        response.setHeader('Content-Length', buffer.length);

        return response.send(buffer);
    } catch (error) {
        console.error('Error downloading file:', error);
        return response.status(500).json({ error: 'Error downloading file' });
    }
}
