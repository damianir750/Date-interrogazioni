import { neon } from '@netlify/neon';
const sql = neon();

export async function handler(event) {
    try {
        const { name } = JSON.parse(event.body);
        if (!name) {
            return { 
                statusCode: 400, 
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ error: "Nome materia richiesto" }) 
            };
        }
        
        // Verifica se ci sono studenti con questa materia
        const students = await sql`
            SELECT COUNT(*) as count 
            FROM students 
            WHERE subject = ${name}
        `;
        
        if (students[0].count > 0) {
            return { 
                statusCode: 400, 
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    error: "Non puoi eliminare una materia con studenti associati" 
                }) 
            };
        }
        
        // Elimina la materia
        await sql`DELETE FROM subjects WHERE name = ${name}`;
        
        return { 
            statusCode: 200, 
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ success: true }) 
        };
        
    } catch (error) {
        return { 
            statusCode: 500, 
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: error.message }) 
        };
    }
}