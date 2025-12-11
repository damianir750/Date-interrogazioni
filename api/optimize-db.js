import { neon } from '@neondatabase/serverless';

if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not defined");
}
const sql = neon(process.env.DATABASE_URL);

export default async function handler(request, response) {
    try {
        await sql`CREATE INDEX IF NOT EXISTS idx_students_sorting ON students(grades_count ASC, last_interrogation ASC);`;
        return response.status(200).json({ message: "Index created successfully" });
    } catch (error) {
        return response.status(500).json({ error: error.message });
    }
}
