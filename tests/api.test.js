import { describe, it, expect, vi, beforeEach } from 'vitest';


// Mock the database
vi.mock('../api/_db.js', () => ({
    default: vi.fn()
}));

// Mock auth to always pass for API tests
vi.mock('../api/_auth.js', () => ({
    requireAuth: vi.fn().mockResolvedValue(true)
}));

import sql from '../api/_db.js';

// Helper: create mock request/response
function createMocks(method = 'GET', body = null) {
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
// STUDENTS API (/api/students)
// =====================================================
describe('/api/students', () => {
    let handler;

    beforeEach(async () => {
        vi.resetModules();
        vi.mock('../api/_db.js', () => ({ default: vi.fn() }));
        vi.mock('../api/_auth.js', () => ({ requireAuth: vi.fn().mockResolvedValue(true) }));
        const mod = await import('../api/students.js');
        handler = mod.default;
    });

    describe('GET', () => {
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

    describe('POST', () => {
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

    describe('PUT', () => {
        it('updates student and returns 200', async () => {
            const { default: sql } = await import('../api/_db.js');
            const updated = { id: 1, name: 'Nuovo Nome', grades_count: 3 };
            sql.mockResolvedValueOnce([updated]);

            const { req, res } = createMocks('PUT', { id: 1, name: 'Nuovo Nome' });
            await handler(req, res);
            expect(res._status).toBe(200);
            expect(res._body.name).toBe('Nuovo Nome');
        });

        it('returns 404 if student not found', async () => {
            const { default: sql } = await import('../api/_db.js');
            sql.mockResolvedValueOnce([undefined]);

            const { req, res } = createMocks('PUT', { id: 999, name: 'Test' });
            await handler(req, res);
            expect(res._status).toBe(404);
        });
    });

    describe('DELETE', () => {
        it('deletes student with valid id', async () => {
            const { default: sql } = await import('../api/_db.js');
            sql.mockResolvedValueOnce([]);

            const { req, res } = createMocks('DELETE', { id: 1 });
            await handler(req, res);
            expect(res._status).toBe(200);
            expect(res._body.success).toBe(true);
        });
    });

    it('rejects unsupported methods', async () => {
        const { req, res } = createMocks('PATCH');
        await handler(req, res);
        expect(res._status).toBe(405);
    });
});

// =====================================================
// SUBJECTS API (/api/subjects)
// =====================================================
describe('/api/subjects', () => {
    let handler;

    beforeEach(async () => {
        vi.resetModules();
        vi.mock('../api/_db.js', () => ({ default: vi.fn() }));
        vi.mock('../api/_auth.js', () => ({ requireAuth: vi.fn().mockResolvedValue(true) }));
        const mod = await import('../api/subjects.js');
        handler = mod.default;
    });

    describe('GET', () => {
        it('returns subjects list', async () => {
            const { default: sql } = await import('../api/_db.js');
            const mockSubjects = [{ name: 'Matematica', color: '#FF0000' }];
            sql.mockResolvedValueOnce(mockSubjects);

            const { req, res } = createMocks('GET');
            await handler(req, res);
            expect(res._status).toBe(200);
            expect(res._body).toEqual(mockSubjects);
        });
    });

    describe('POST', () => {
        it('inserts/updates valid subject', async () => {
            const { default: sql } = await import('../api/_db.js');
            const mockSubject = { name: 'Matematica', color: '#FF0000' };
            sql.mockResolvedValueOnce([mockSubject]);

            const { req, res } = createMocks('POST', { name: 'Matematica', color: '#FF0000' });
            await handler(req, res);
            expect(res._status).toBe(200);
        });
    });

    describe('DELETE', () => {
        it('deletes subject and returns 200', async () => {
            const { default: sql } = await import('../api/_db.js');
            sql.mockResolvedValueOnce([]);

            const { req, res } = createMocks('DELETE', { name: 'Matematica' });
            await handler(req, res);
            expect(res._status).toBe(200);
            expect(res._body.success).toBe(true);
        });
    });
});

// =====================================================
// AUTH API (/api/auth)
// =====================================================
describe('/api/auth', () => {
    let handler;

    beforeEach(async () => {
        vi.resetModules();
        vi.stubEnv('AUTH_CODE', 'secret123');
        vi.stubEnv('UPSTASH_REDIS_REST_URL', '');
        vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', '');
        const mod = await import('../api/auth.js');
        handler = mod.default;
    });

    it('accepts correct code', async () => {
        const { req, res } = createMocks('POST', { code: 'secret123' });
        await handler(req, res);
        expect(res._status).toBe(200);
        expect(res._body.success).toBe(true);
    });

    it('rejects wrong code', async () => {
        const { req, res } = createMocks('POST', { code: 'wrong' });
        await handler(req, res);
        expect(res._status).toBe(401);
    });

    it('accepts any code when AUTH_CODE is not set (dev mode)', async () => {
        vi.resetModules();
        vi.stubEnv('AUTH_CODE', '');
        vi.stubEnv('NODE_ENV', 'development');
        vi.stubEnv('UPSTASH_REDIS_REST_URL', '');
        vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', '');
        const mod = await import('../api/auth.js');

        const { req, res } = createMocks('POST', { code: 'anything' });
        await mod.default(req, res);
        expect(res._status).toBe(200);
    });
});
