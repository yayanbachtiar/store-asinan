import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  formatGcpLog,
  parseTraceContext,
  createLogger,
  type HttpRequestLog,
} from "../src/lib/logger";

describe("logger parseTraceContext", () => {
  it("parses valid x-cloud-trace-context header", () => {
    const header = "105445aa7843bc8bf206b120001000/1;o=1";
    const parsed = parseTraceContext(header);
    expect(parsed.traceId).toBe("105445aa7843bc8bf206b120001000");
    expect(parsed.spanId).toBe("1");
    expect(parsed.sampled).toBe(true);
  });

  it("handles trace header without options", () => {
    const header = "4c26639f4c19e7f60869152b404c2af2";
    const parsed = parseTraceContext(header);
    expect(parsed.traceId).toBe("4c26639f4c19e7f60869152b404c2af2");
    expect(parsed.spanId).toBeUndefined();
    expect(parsed.sampled).toBe(false);
  });

  it("returns empty object for empty or missing header", () => {
    expect(parseTraceContext(null)).toEqual({});
    expect(parseTraceContext("")).toEqual({});
  });
});

describe("logger formatGcpLog", () => {
  it("formats structured GCP log with severity, message, timestamp, and metadata", () => {
    const entry = formatGcpLog({
      severity: "INFO",
      message: "Order created successfully",
      projectId: "demo-kas-asinan",
      traceId: "4c26639f4c19e7f6",
      spanId: "0000000000000001",
      requestId: "req-123",
      meta: {
        batchId: "batch-1",
        cups: 10,
      },
    });

    expect(entry.severity).toBe("INFO");
    expect(entry.message).toBe("Order created successfully");
    expect(entry["logging.googleapis.com/trace"]).toBe(
      "projects/demo-kas-asinan/traces/4c26639f4c19e7f6"
    );
    expect(entry["logging.googleapis.com/spanId"]).toBe("0000000000000001");
    expect(entry.requestId).toBe("req-123");
    expect(entry.batchId).toBe("batch-1");
    expect(entry.cups).toBe(10);
    expect(entry.timestamp).toBeDefined();
  });

  it("includes httpRequest conforming to GCP LogEntry format", () => {
    const http: HttpRequestLog = {
      requestMethod: "GET",
      requestUrl: "http://localhost:3000/api/chat",
      status: 200,
      userAgent: "curl/7.88.1",
      latency: "0.150s",
      remoteIp: "127.0.0.1",
    };

    const entry = formatGcpLog({
      severity: "INFO",
      message: "GET /api/chat 200",
      httpRequest: http,
      requestId: "req-abc",
    });

    expect(entry.httpRequest).toEqual(http);
    expect(entry.requestId).toBe("req-abc");
  });

  it("serializes Error stack trace into stack_trace or error field", () => {
    const error = new Error("Database timeout");
    const entry = formatGcpLog({
      severity: "ERROR",
      message: "Failed to connect to database",
      error,
    });

    expect(entry.severity).toBe("ERROR");
    expect(entry.error?.message).toBe("Database timeout");
    expect(entry.error?.stack).toBeDefined();
  });
});

describe("createLogger", () => {
  let logSpy: ReturnType<typeof vi.spyOn>;
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    logSpy.mockRestore();
    errorSpy.mockRestore();
  });

  it("emits single-line JSON string to stdout for info logs", () => {
    const logger = createLogger({ requestId: "req-test-1" });
    logger.info("Server started", { port: 3000 });

    expect(logSpy).toHaveBeenCalledTimes(1);
    const parsed = JSON.parse(logSpy.mock.calls[0][0]);
    expect(parsed.severity).toBe("INFO");
    expect(parsed.message).toBe("Server started");
    expect(parsed.port).toBe(3000);
    expect(parsed.requestId).toBe("req-test-1");
  });

  it("emits single-line JSON string to stderr for error logs", () => {
    const logger = createLogger({ requestId: "req-err-1" });
    logger.error("Connection failed", new Error("ECONNREFUSED"), { host: "localhost" });

    expect(errorSpy).toHaveBeenCalledTimes(1);
    const parsed = JSON.parse(errorSpy.mock.calls[0][0]);
    expect(parsed.severity).toBe("ERROR");
    expect(parsed.message).toBe("Connection failed");
    expect(parsed.error?.message).toBe("ECONNREFUSED");
    expect(parsed.host).toBe("localhost");
    expect(parsed.requestId).toBe("req-err-1");
  });

  it("creates child logger preserving or overriding trace context", () => {
    const parent = createLogger({ requestId: "req-parent", traceId: "trace-parent" });
    const child = parent.child({ spanId: "span-child" });

    child.info("Child log event");
    expect(logSpy).toHaveBeenCalledTimes(1);
    const parsed = JSON.parse(logSpy.mock.calls[0][0]);
    expect(parsed.requestId).toBe("req-parent");
    expect(parsed["logging.googleapis.com/trace"]).toContain("trace-parent");
    expect(parsed["logging.googleapis.com/spanId"]).toBe("span-child");
  });
});
