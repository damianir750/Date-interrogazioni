import { neon } from '@neondatabase/serverless';

export default async function handler(request, response) {
    const sql = neon(process.env.DATABASE_URL);
    const { id } = request.query;

    if (!id) return response.status(400).json({ error: 'Missing file ID' });

    try {
        const files = await sql`SELECT name, type, content FROM archive_files WHERE id = ${id}`;

        if (files.length === 0) {
            return response.status(404).json({ error: 'File not found' });
        }

        const file = files[0];
        let finalBuffer;

        // --- THE FIX IS HERE ---
        // Postgres via HTTP returns BYTEA as a string starting with '\x'
        if (typeof file.content === 'string' && file.content.startsWith('\\x')) {
            // Remove the '\x' prefix and decode from Hex
            finalBuffer = Buffer.from(file.content.slice(2), 'hex');
        } else if (Buffer.isBuffer(file.content)) {
            // Just in case the driver updates to return Buffers natively
            finalBuffer = file.content;
        } else {
            // Fallback for safety
             finalBuffer = Buffer.from(file.content);
        }
        // -----------------------

        response.setHeader('Content-Type', file.type || 'application/octet-stream');
        response.setHeader('Content-Disposition', `attachment; filename="${file.name}"`);
        response.setHeader('Content-Length', finalBuffer.length);

        return response.send(finalBuffer);

    } catch (error) {
        console.error('Error downloading file:', error);
        return response.status(500).json({ error: 'Error downloading file' });
    }
}
