import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the database
vi.mock('../api/_db.js', () => ({
    default: vi.fn()
}));

// Mock auth to always pass
vi.mock('../api/_auth.js', () => ({
    requireAuth: vi.fn().mockResolvedValue(true)
}));

import sql from '../api/_db.js';

// Helper: create mock request/response
function createMocks(method = 'POST', body = null) {
    return {
        req: {
            method,
            headers: { 'content-type': 'application/json', 'x-auth-code': 'test' },
            body
        },
        res: {
            _status: null,
            _body: null,
            status(code) { this._status = code; return this; },
            json(data) { this._body = data; return this; }
        }
    };
}

// =====================================================
// ADD STUDENT
// =====================================================
describe('POST /api/add-student', () => {
    let handler;

    beforeEach(async () => {
        vi.resetModules();
        vi.mock('../api/_db.js', () => ({ default: vi.fn() }));
        vi.mock('../api/_auth.js', () => ({ requireAuth: vi.fn().mockResolvedValue(true) }));
        const mod = await import('../api/add-student.js');
        handler = mod.default;
    });

    it('rejects non-POST methods', async () => {
        const { req, res } = createMocks('GET');
        await handler(req, res);
        expect(res._status).toBe(405);
    });

    it('rejects invalid JSON string body', async () => {
        const { req, res } = createMocks('POST', 'not-json');
        await handler(req, res);
        expect(res._status).toBe(400);
    });

    it('rejects missing required fields', async () => {
        const { req, res } = createMocks('POST', { name: '' });
        await handler(req, res);
        expect(res._status).toBe(400);
    });

    it('inserts valid student and returns 200', async () => {
        const { default: sql } = await import('../api/_db.js');
        const mockStudent = { id: 1, name: 'Mario', subject: 'Italiano', grades_count: 0, last_interrogation: '2026-01-01' };
        sql.mockResolvedValueOnce([mockStudent]);

        const { req, res } = createMocks('POST', {
            name: 'Mario',
            subject: 'Italiano',
            last_interrogation: '2026-01-01',
            grades_count: 0
        });
        await handler(req, res);
        expect(res._status).toBe(200);
        expect(res._body).toEqual(mockStudent);
    });
});

// =====================================================
// ADD SUBJECT
// =====================================================
describe('POST /api/add-subject', () => {
    let handler;

    beforeEach(async () => {
        vi.resetModules();
        vi.mock('../api/_db.js', () => ({ default: vi.fn() }));
        vi.mock('../api/_auth.js', () => ({ requireAuth: vi.fn().mockResolvedValue(true) }));
        const mod = await import('../api/add-subject.js');
        handler = mod.default;
    });

    it('rejects non-POST', async () => {
        const { req, res } = createMocks('GET');
        await handler(req, res);
        expect(res._status).toBe(405);
    });

    it('rejects missing color', async () => {
        const { req, res } = createMocks('POST', { name: 'Matematica' });
        await handler(req, res);
        expect(res._status).toBe(400);
    });

    it('rejects invalid hex color', async () => {
        const { req, res } = createMocks('POST', { name: 'Matematica', color: 'red' });
        await handler(req, res);
        expect(res._status).toBe(400);
    });

    it('inserts valid subject and returns 200', async () => {
        const { default: sql } = await import('../api/_db.js');
        const mockSubject = { id: 1, name: 'Matematica', color: '#FF0000' };
        sql.mockResolvedValueOnce([mockSubject]);

        const { req, res } = createMocks('POST', { name: 'Matematica', color: '#FF0000' });
        await handler(req, res);
        expect(res._status).toBe(200);
        expect(res._body).toEqual(mockSubject);
    });
});

// =====================================================
// DELETE STUDENT
// =====================================================
describe('POST /api/delete-student', () => {
    let handler;

    beforeEach(async () => {
        vi.resetModules();
        vi.mock('../api/_db.js', () => ({ default: vi.fn() }));
        vi.mock('../api/_auth.js', () => ({ requireAuth: vi.fn().mockResolvedValue(true) }));
        const mod = await import('../api/delete-student.js');
        handler = mod.default;
    });

    it('rejects missing id', async () => {
        const { req, res } = createMocks('POST', {});
        await handler(req, res);
        expect(res._status).toBe(400);
    });

    it('deletes student with valid id', async () => {
        const { default: sql } = await import('../api/_db.js');
        sql.mockResolvedValueOnce([]);

        const { req, res } = createMocks('POST', { id: 1 });
        await handler(req, res);
        expect(res._status).toBe(200);
        expect(res._body.success).toBe(true);
    });
});

// =====================================================
// GET STUDENTS
// =====================================================
describe('GET /api/get-students', () => {
    let handler;

    beforeEach(async () => {
        vi.resetModules();
        vi.mock('../api/_db.js', () => ({ default: vi.fn() }));
        vi.mock('../api/_auth.js', () => ({ requireAuth: vi.fn().mockResolvedValue(true) }));
        const mod = await import('../api/get-students.js');
        handler = mod.default;
    });

    it('rejects non-GET', async () => {
        const { req, res } = createMocks('POST');
        await handler(req, res);
        expect(res._status).toBe(405);
    });

    it('returns students list', async () => {
        const { default: sql } = await import('../api/_db.js');
        const mockStudents = [{ id: 1, name: 'Mario' }, { id: 2, name: 'Luigi' }];
        sql.mockResolvedValueOnce(mockStudents);

        const { req, res } = createMocks('GET');
        await handler(req, res);
        expect(res._status).toBe(200);
        expect(res._body).toEqual(mockStudents);
    });
});

// =====================================================
// UPDATE STUDENT
// =====================================================
describe('POST /api/update-student', () => {
    let handler;

    beforeEach(async () => {
        vi.resetModules();
        vi.mock('../api/_db.js', () => ({ default: vi.fn() }));
        vi.mock('../api/_auth.js', () => ({ requireAuth: vi.fn().mockResolvedValue(true) }));
        const mod = await import('../api/update-student.js');
        handler = mod.default;
    });

    it('rejects missing id', async () => {
        const { req, res } = createMocks('POST', { name: 'Nuovo Nome' });
        await handler(req, res);
        expect(res._status).toBe(400);
    });

    it('returns 404 if student not found', async () => {
        const { default: sql } = await import('../api/_db.js');
        sql.mockResolvedValueOnce([undefined]);

        const { req, res } = createMocks('POST', { id: 999, name: 'Test' });
        await handler(req, res);
        expect(res._status).toBe(404);
    });

    it('updates student and returns 200', async () => {
        const { default: sql } = await import('../api/_db.js');
        const updated = { id: 1, name: 'Nuovo Nome', grades_count: 3 };
        sql.mockResolvedValueOnce([updated]);

        const { req, res } = createMocks('POST', { id: 1, name: 'Nuovo Nome' });
        await handler(req, res);
        expect(res._status).toBe(200);
        expect(res._body.name).toBe('Nuovo Nome');
    });
});

// =====================================================
// VERIFY CODE
// =====================================================
describe('POST /api/verify-code', () => {
    let handler;

    beforeEach(async () => {
        vi.resetModules();
        vi.stubEnv('AUTH_CODE', 'secret123');
        vi.stubEnv('UPSTASH_REDIS_REST_URL', '');
        vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', '');
        const mod = await import('../api/verify-code.js');
        handler = mod.default;
    });

    it('rejects non-POST', async () => {
        const { req, res } = createMocks('GET');
        await handler(req, res);
        expect(res._status).toBe(405);
    });

    it('rejects missing code', async () => {
        const { req, res } = createMocks('POST', {});
        await handler(req, res);
        expect(res._status).toBe(400);
    });

    it('rejects wrong code', async () => {
        const { req, res } = createMocks('POST', { code: 'wrong' });
        await handler(req, res);
        expect(res._status).toBe(401);
    });

    it('accepts correct code', async () => {
        const { req, res } = createMocks('POST', { code: 'secret123' });
        await handler(req, res);
        expect(res._status).toBe(200);
        expect(res._body.success).toBe(true);
    });

    it('accepts any code when AUTH_CODE is not set (dev mode)', async () => {
        vi.resetModules();
        vi.stubEnv('AUTH_CODE', '');
        vi.stubEnv('NODE_ENV', 'development');
        vi.stubEnv('UPSTASH_REDIS_REST_URL', '');
        vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', '');
        const mod = await import('../api/verify-code.js');

        const { req, res } = createMocks('POST', { code: 'anything' });
        await mod.default(req, res);
        expect(res._status).toBe(200);
    });
});
