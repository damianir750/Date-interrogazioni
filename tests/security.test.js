import { describe, it, expect, vi, beforeEach } from "vitest";

// Top-level mock for Ratelimit
vi.mock("@upstash/ratelimit", () => {
  const mockLimit = vi.fn().mockResolvedValue({ success: true });
  const mockSlidingWindow = vi.fn();

  class Ratelimit {
    constructor() {
      this.limit = mockLimit;
    }
    static slidingWindow = mockSlidingWindow;
  }

  return { Ratelimit, mockLimit };
});

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
    _headers: {},
    status(code) {
      this._status = code;
      return this;
    },
    json(data) {
      this._body = data;
      return this;
    },
    setHeader(name, value) {
      this._headers[name] = value;
      return this;
    },
  };

  return { req, res };
}

describe("Security Layer", () => {
  describe("Authentication Cookie Strategy", () => {
    it("sets HttpOnly cookie on successful login", async () => {
      vi.resetModules();
      vi.stubEnv("AUTH_CODE", "secure-pass");
      // Mock redis so it passes startup checks
      vi.stubEnv("UPSTASH_REDIS_REST_URL", "https://mock");
      vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "token");

      const { default: handler } = await import("../api/auth.js");
      const { req, res } = createMocks("POST", {}, { code: "secure-pass" });

      await handler(req, res);

      // Expected Hash
      const crypto = await import("crypto");
      const hash = crypto
        .createHash("sha256")
        .update("secure-pass")
        .digest("hex");

      expect(res._status).toBe(200);
      expect(res._headers["Set-Cookie"]).toBeDefined();
      expect(res._headers["Set-Cookie"]).toContain(`auth_code=${hash}`);
      expect(res._headers["Set-Cookie"]).toContain("HttpOnly");
      expect(res._headers["Set-Cookie"]).toContain("SameSite=Strict");
    });
  });

  describe("Rate Limiter Fail-Closed Policy", () => {
    it("returns 503 if rate limiter fails", async () => {
      const { mockLimit } = await import("@upstash/ratelimit");
      mockLimit.mockRejectedValue(new Error("Redis Down"));

      vi.resetModules();
      vi.stubEnv("AUTH_CODE", "test");
      vi.stubEnv("UPSTASH_REDIS_REST_URL", "https://test");
      vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "token");

      const { requireAuth } = await import("../api/_auth.js");
      const { req, res } = createMocks("GET", { cookie: "auth_code=test" });

      const result = await requireAuth(req, res, "students");

      expect(result).toBe(false);
      expect(res._status).toBe(503);
      expect(res._body.error).toContain("Limitatore");
    });
  });
});
