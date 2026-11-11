import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";
import { middleware } from "../src/middleware";

describe("Next.js middleware with GCP Logging and Request ID", () => {
  let logSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    logSpy.mockRestore();
  });

  it("redirects unauthenticated users trying to access protected dashboard pages", () => {
    const req = new NextRequest("http://localhost:3000/");
    const res = middleware(req);
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("/login");
  });

  it("allows access and attaches x-request-id and x-trace-id when session exists", () => {
    const req = new NextRequest("http://localhost:3000/", {
      headers: {
        cookie: "asinan_session=mocktoken",
        "user-agent": "VitestAgent",
      },
    });

    const res = middleware(req);
    expect(res.status).toBe(200);
    const requestId = res.headers.get("x-request-id");
    expect(requestId).toBeDefined();
    expect(typeof requestId).toBe("string");
    expect(requestId?.length).toBeGreaterThan(10);

    const traceId = res.headers.get("x-trace-id");
    expect(traceId).toBeDefined();
  });

  it("preserves incoming x-request-id and x-cloud-trace-context", () => {
    const req = new NextRequest("http://localhost:3000/api/chat", {
      headers: {
        cookie: "asinan_session=mocktoken",
        "x-request-id": "custom-req-id-12345",
        "x-cloud-trace-context": "105445aa7843bc8bf206b120001000/1;o=1",
      },
    });

    const res = middleware(req);
    expect(res.headers.get("x-request-id")).toBe("custom-req-id-12345");
    expect(res.headers.get("x-trace-id")).toBe("105445aa7843bc8bf206b120001000");

    // Also check that GCP structured HTTP log was emitted
    expect(logSpy).toHaveBeenCalled();
    const lastCall = logSpy.mock.calls[logSpy.mock.calls.length - 1][0];
    const parsed = JSON.parse(lastCall);
    expect(parsed.requestId).toBe("custom-req-id-12345");
    expect(parsed["logging.googleapis.com/trace"]).toContain("105445aa7843bc8bf206b120001000");
    expect(parsed.httpRequest).toBeDefined();
    expect(parsed.httpRequest.requestMethod).toBe("GET");
  });
});
