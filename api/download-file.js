import { neon } from '@neondatabase/serverless';

export default async function handler(request, response) {
    const sql = neon(process.env.DATABASE_URL);
    const { id } = request.query;

    if (!id) {
        return response.status(400).json({ error: 'Missing file ID' });
    }

    try {
        // 1. Select the data
        const files = await sql`
            SELECT name, type, content 
            FROM archive_files 
            WHERE id = ${id}
        `;

        if (files.length === 0) {
            return response.status(404).json({ error: 'File not found' });
        }

        const file = files[0];

        let buffer;

        // 2. Check if the driver returned a string (Hex) or a Buffer
        if (typeof file.content === 'string' && file.content.startsWith('\\x')) {
            // Postgres Hex format: Remove the '\x' prefix and decode 'hex'
            buffer = Buffer.from(file.content.slice(2), 'hex');
        } else if (Buffer.isBuffer(file.content)) {
            // In case the driver creates a Buffer automatically
            buffer = file.content;
        } else {
            // Fallback/Error if format is unexpected
            console.error('Unexpected content format:', typeof file.content);
            return response.status(500).json({ error: 'File corruption error' });
        }

        // 3. Set headers for download
        response.setHeader('Content-Type', file.type || 'application/octet-stream');
        response.setHeader('Content-Disposition', `attachment; filename="${file.name}"`);
        response.setHeader('Content-Length', buffer.length);

        // 4. Send the buffer
        return response.send(buffer);

    } catch (error) {
        console.error('Error downloading file:', error);
        return response.status(500).json({ error: 'Error downloading file' });
    }
}
