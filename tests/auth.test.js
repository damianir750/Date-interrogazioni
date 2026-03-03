import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock environment
vi.stubEnv('AUTH_CODE', 'test-secret-code');
vi.stubEnv('UPSTASH_REDIS_REST_URL', '');
vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', '');

// Helper: create mock request/response objects
function createMocks(method = 'GET', headers = {}, body = null) {
    const req = {
        method,
        headers: { 'content-type': 'application/json', ...headers },
        body
    };

    const res = {
        _status: null,
        _body: null,
        status(code) {
            this._status = code;
            return this;
        },
        json(data) {
            this._body = data;
            return this;
        }
    };

    return { req, res };
}

describe('requireAuth', () => {
    let requireAuth;

    beforeEach(async () => {
        // Re-import to pick up env changes
        vi.resetModules();
        vi.stubEnv('AUTH_CODE', 'test-secret-code');
        vi.stubEnv('UPSTASH_REDIS_REST_URL', '');
        vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', '');
        const mod = await import('../api/_auth.js');
        requireAuth = mod.requireAuth;
    });

    it('allows request with correct auth code', async () => {
        const { req, res } = createMocks('GET', { 'x-auth-code': 'test-secret-code' });
        const result = await requireAuth(req, res);
        expect(result).toBe(true);
        expect(res._status).toBeNull();
    });

    it('blocks request with wrong auth code', async () => {
        const { req, res } = createMocks('GET', { 'x-auth-code': 'wrong-code' });
        const result = await requireAuth(req, res);
        expect(result).toBe(false);
        expect(res._status).toBe(401);
    });

    it('blocks request with no auth code', async () => {
        const { req, res } = createMocks('GET', {});
        const result = await requireAuth(req, res);
        expect(result).toBe(false);
        expect(res._status).toBe(401);
    });

    it('allows all requests when AUTH_CODE is not configured (dev mode)', async () => {
        vi.resetModules();
        vi.stubEnv('AUTH_CODE', '');
        const mod = await import('../api/_auth.js');

        const { req, res } = createMocks('GET', {});
        const result = await mod.requireAuth(req, res);
        expect(result).toBe(true);
    });
});
