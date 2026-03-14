import { describe, it, expect, vi, beforeEach } from "vitest";

// Top-level mock for Ratelimit
vi.mock("@upstash/ratelimit", () => {
  const mockLimit = vi.fn().mockResolvedValue({ success: true });
  class Ratelimit {
    constructor() {
      this.limit = mockLimit;
    }
    static slidingWindow = vi.fn();
  }
  return { Ratelimit };
});

// Mock environment
vi.stubEnv("AUTH_CODE", "test-secret-code");
vi.stubEnv("UPSTASH_REDIS_REST_URL", "https://mock-redis");
vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "mock-token");

// Helper: create mock request/response objects
function createMocks(method = "GET", headers = {}, body = null) {
  const req = {
    method,
    headers: { "content-type": "application/json", ...headers },
    body,
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
    },
  };

  return { req, res };
}

describe("requireAuth", () => {
  let requireAuth;

  beforeEach(async () => {
    // Re-import to pick up env changes
    vi.resetModules();
    vi.stubEnv("AUTH_CODE", "test-secret-code");
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "https://mock-redis");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "mock-token");
    const mod = await import("../api/_auth.js");
    requireAuth = mod.requireAuth;
  });

  it("allows request with correct auth code hash", async () => {
    // Need to hash 'test-secret-code'
    const crypto = await import("crypto");
    const hash = crypto
      .createHash("sha256")
      .update("test-secret-code")
      .digest("hex");

    const { req, res } = createMocks("GET", { cookie: `auth_code=${hash}` });
    const result = await requireAuth(req, res);
    expect(result).toBe(true);
    expect(res._status).toBeNull();
  });

  it("blocks request with wrong auth code", async () => {
    const { req, res } = createMocks("GET", { cookie: "auth_code=wrong-code" });
    const result = await requireAuth(req, res);
    expect(result).toBe(false);
    expect(res._status).toBe(401);
  });

  it("blocks request with no auth code", async () => {
    const { req, res } = createMocks("GET", {});
    const result = await requireAuth(req, res);
    expect(result).toBe(false);
    expect(res._status).toBe(401);
  });

  it("blocks all requests when AUTH_CODE is not configured with 500", async () => {
    vi.resetModules();
    vi.stubEnv("AUTH_CODE", "");
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "https://mock");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "token");
    const mod = await import("../api/_auth.js");

    const { req, res } = createMocks("GET", {});
    const result = await mod.requireAuth(req, res);
    expect(result).toBe(false);
    expect(res._status).toBe(500);
  });
});
