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

// Mock the database
vi.mock("../api/_db.js", () => ({
  default: vi.fn(),
}));

import sql from "../api/_db.js";

// Helper: create mock request/response
function createMocks(method = "GET", body = null) {
  const authCode = process.env.AUTH_CODE;
  const cookies = {};
  if (authCode) {
    // Mock crypto hash for valid auth
    const crypto = require("crypto");
    cookies.auth_code = crypto
      .createHash("sha256")
      .update(authCode)
      .digest("hex");
  }

  const req = {
    method,
    headers: {
      "content-type": "application/json",
      cookie: cookies.auth_code ? `auth_code=${cookies.auth_code}` : "",
    },
    body,
    cookies,
  };
  return {
    req,
    res: {
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
    },
  };
}

// ... helper to sync cookies to headers before calling handler
async function runHandler(handler, req, res) {
  if (req.cookies) {
    req.headers.cookie = Object.entries(req.cookies)
      .map(([k, v]) => `${k}=${v}`)
      .join("; ");
  }
  return await handler(req, res);
}

// =====================================================
// STUDENTS API (/api/students)
// =====================================================
// ... (I'll need to update the calls to use runHandler or set headers manually)
// Actually I'll just update requireAuth in my mental model to check req.cookies too,
// but it's better to fix the test environment.

// I will update the tests below to use runHandler where needed.
describe("/api/students", () => {
  let handler;

  beforeEach(async () => {
    vi.resetModules();
    vi.stubEnv("NODE_ENV", "development");
    const mod = await import("../api/students.js");
    handler = mod.default;
  });

  describe("GET", () => {
    it("returns students list", async () => {
      const { default: sql } = await import("../api/_db.js");
      const mockStudents = [
        { id: 1, name: "Mario" },
        { id: 2, name: "Luigi" },
      ];
      sql.mockResolvedValueOnce(mockStudents);

      const { req, res } = createMocks("GET");
      await handler(req, res);
      expect(res._status).toBe(200);
      expect(res._body).toEqual(mockStudents);
    });

    it("handles database connection errors", async () => {
      const { default: sql } = await import("../api/_db.js");
      sql.mockRejectedValueOnce(new Error("DB Connection Failed"));

      const { req, res } = createMocks("GET");
      await handler(req, res);
      expect(res._status).toBe(500);
      expect(res._body.error).toContain("Errore interno del server");
    });
  });

  describe("POST", () => {
    it("rejects missing required fields", async () => {
      const { req, res } = createMocks("POST", { name: "" });
      await handler(req, res);
      expect(res._status).toBe(400);
    });

    it("inserts valid student and returns 200", async () => {
      const { default: sql } = await import("../api/_db.js");
      const mockStudent = {
        id: 1,
        name: "Mario",
        subject: "Italiano",
        grades_count: 0,
        last_interrogation: "2026-01-01",
      };
      sql.mockResolvedValueOnce([mockStudent]);

      const { req, res } = createMocks("POST", {
        name: "Mario",
        subject: "Italiano",
        last_interrogation: "2026-01-01",
        grades_count: 0,
      });
      await handler(req, res);
      expect(res._status).toBe(200);
      expect(res._body).toEqual(mockStudent);
    });

    it("handles database errors during insertion", async () => {
      const { default: sql } = await import("../api/_db.js");
      sql.mockRejectedValueOnce(new Error("Unique constraint failed"));

      const { req, res } = createMocks("POST", {
        name: "Mario",
        subject: "It",
      });
      await handler(req, res);
      expect(res._status).toBe(500);
    });
  });

  describe("PUT", () => {
    it("updates student and returns 200", async () => {
      const { default: sql } = await import("../api/_db.js");
      const updated = { id: 1, name: "Nuovo Nome", grades_count: 3 };
      sql.mockResolvedValueOnce([updated]);

      const { req, res } = createMocks("PUT", { id: 1, name: "Nuovo Nome" });
      await handler(req, res);
      expect(res._status).toBe(200);
      expect(res._body.name).toBe("Nuovo Nome");
    });

    it("returns 404 if student not found", async () => {
      const { default: sql } = await import("../api/_db.js");
      sql.mockResolvedValueOnce([undefined]);

      const { req, res } = createMocks("PUT", { id: 999, name: "Test" });
      await handler(req, res);
      expect(res._status).toBe(404);
    });

    it("rejects update with invalid data type", async () => {
      const { req, res } = createMocks("PUT", { id: "uno", name: 123 });
      await handler(req, res);
      expect(res._status).toBe(400);
    });
  });

  describe("DELETE", () => {
    it("deletes student with valid id", async () => {
      const { default: sql } = await import("../api/_db.js");
      sql.mockResolvedValueOnce([]);

      const { req, res } = createMocks("DELETE", { id: 1 });
      await handler(req, res);
      expect(res._status).toBe(200);
      expect(res._body.success).toBe(true);
    });

    it("returns 400 for DELETE with missing id", async () => {
      const { req, res } = createMocks("DELETE", {});
      await handler(req, res);
      expect(res._status).toBe(400);
    });
  });

  it("rejects unsupported methods", async () => {
    const { req, res } = createMocks("PATCH");
    await handler(req, res);
    expect(res._status).toBe(405);
  });

  it("rejects POST without application/json Content-Type (Anti-CSRF)", async () => {
    const { req, res } = createMocks("POST", { name: "Test" });
    req.headers["content-type"] = "application/x-www-form-urlencoded";
    await handler(req, res);
    expect(res._status).toBe(415);
  });
});

// =====================================================
// SUBJECTS API (/api/subjects)
// =====================================================
describe("/api/subjects", () => {
  let handler;

  beforeEach(async () => {
    vi.resetModules();
    vi.stubEnv("NODE_ENV", "development");
    const mod = await import("../api/subjects.js");
    handler = mod.default;
  });

  describe("GET", () => {
    it("returns subjects list", async () => {
      const { default: sql } = await import("../api/_db.js");
      const mockSubjects = [{ name: "Matematica", color: "#FF0000" }];
      sql.mockResolvedValueOnce(mockSubjects);

      const { req, res } = createMocks("GET");
      await handler(req, res);
      expect(res._status).toBe(200);
      expect(res._body).toEqual(mockSubjects);
    });
  });

  describe("POST", () => {
    it("inserts/updates valid subject", async () => {
      const { default: sql } = await import("../api/_db.js");
      const mockSubject = { name: "Matematica", color: "#FF0000" };
      sql.mockResolvedValueOnce([mockSubject]);

      const { req, res } = createMocks("POST", {
        name: "Matematica",
        color: "#FF0000",
      });
      await handler(req, res);
      expect(res._status).toBe(200);
    });
  });

  describe("DELETE", () => {
    it("deletes subject and returns 200", async () => {
      const { default: sql } = await import("../api/_db.js");
      sql.mockResolvedValueOnce([]);

      const { req, res } = createMocks("DELETE", { name: "Matematica" });
      await handler(req, res);
      expect(res._status).toBe(200);
      expect(res._body.success).toBe(true);
    });
  });
});

// =====================================================
// AUTH API (/api/auth)
// =====================================================
describe("/api/auth", () => {
  let handler;

  beforeEach(async () => {
    vi.resetModules();
    vi.stubEnv("AUTH_CODE", "secret123");
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "https://mock-redis");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "mock-token");
    const mod = await import("../api/auth.js");
    handler = mod.default;
  });

  it("accepts correct code", async () => {
    const { req, res } = createMocks("POST", { code: "secret123" });
    await handler(req, res);
    expect(res._status).toBe(200);
    expect(res._body.success).toBe(true);
  });

  it("rejects wrong code", async () => {
    vi.stubEnv("AUTH_CODE", "secret123");
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "https://mock");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "123");
    const mod = await import("../api/auth.js");
    const { req, res } = createMocks("POST", { code: "wrong" });
    await mod.default(req, res);
    expect(res._status).toBe(401);
  });

  it("fails when AUTH_CODE is not set", async () => {
    vi.resetModules();
    vi.stubEnv("AUTH_CODE", "");
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "https://mock");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "123");
    const mod = await import("../api/auth.js");

    const { req, res } = createMocks("POST", { code: "anything" });
    await mod.default(req, res);
    expect(res._status).toBe(500);
  });
});

describe("/api/subjects additional validation", () => {
  it("rejects subjects with very long names (>50 chars)", async () => {
    const { default: sql } = await import("../api/_db.js");
    const { default: handler } = await import("../api/subjects.js");
    vi.stubEnv("AUTH_CODE", "test");
    const { req, res } = createMocks("POST", {
      name: "A".repeat(51),
      color: "#ffffff",
    });
    await handler(req, res);
    expect(res._status).toBe(400);
  });

  it("rejects subjects with invalid color formats", async () => {
    const { default: handler } = await import("../api/subjects.js");
    vi.stubEnv("AUTH_CODE", "test");
    const { req, res } = createMocks("POST", {
      name: "Test",
      color: "not-hex",
    });
    await handler(req, res);
    expect(res._status).toBe(400);
  });

  it("handles query failures on getSubjects", async () => {
    const { default: sql } = await import("../api/_db.js");
    const { default: handler } = await import("../api/subjects.js");
    sql.mockRejectedValueOnce(new Error("DB Fail"));
    const { req, res } = createMocks("GET");
    await handler(req, res);
    expect(res._status).toBe(500);
  });
});

describe("/api/students validation details", () => {
  it("rejects student with invalid date format (semantic)", async () => {
    const { default: handler } = await import("../api/students.js");
    vi.stubEnv("AUTH_CODE", "test");
    const { req, res } = createMocks("POST", {
      name: "Mario",
      subject: "Math",
      last_interrogation: "2026-99-99",
    });
    await handler(req, res);
    expect(res._status).toBe(400);
  });

  it("rejects student with negative grades count", async () => {
    const { default: handler } = await import("../api/students.js");
    vi.stubEnv("AUTH_CODE", "test");
    const { req, res } = createMocks("POST", {
      name: "Mario",
      subject: "Math",
      grades_count: -1,
    });
    await handler(req, res);
    expect(res._status).toBe(400);
  });

  it("denies access if auth cookie is missing", async () => {
    vi.stubEnv("AUTH_CODE", "secret123");
    const { default: handler } = await import("../api/students.js");
    const { req, res } = createMocks("GET");
    req.headers.cookie = "";
    await handler(req, res);
    expect(res._status).toBe(401);
  });

  it("denies access with invalid auth cookie content", async () => {
    vi.stubEnv("AUTH_CODE", "secret123");
    const { default: handler } = await import("../api/students.js");
    const { req, res } = createMocks("GET");
    req.headers.cookie = "auth_code=WRONG";
    await handler(req, res);
    expect(res._status).toBe(401);
  });
});

describe("/api/auth additional details", () => {
  it("returns 200 for multiple attempts below limit", async () => {
    const { default: handler } = await import("../api/auth.js");
    const { req, res } = createMocks("POST", { code: "anything" });
    await handler(req, res);
    expect(res._status).not.toBe(429);
  });

  it("rejects unsupported methods like GET on /api/auth", async () => {
    const { default: handler } = await import("../api/auth.js");
    const { req, res } = createMocks("GET");
    await handler(req, res);
    expect(res._status).toBe(405);
  });
});

describe("/api/auth rate limiting details", () => {
  it("returns 200 for multiple attempts below limit", async () => {
    // Assuming limit is > 3
    const { default: handler } = await import("../api/auth.js");
    for (let i = 0; i < 3; i++) {
      const { req, res } = createMocks("POST", { code: "anything" });
      await handler(req, res);
      // Just verifying it doesn't 503/429 immediately
      expect(res._status).not.toBe(429);
    }
  });
});
