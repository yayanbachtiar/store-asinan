/**
 * Google Cloud Platform (GCP) Standard Structured Logger
 *
 * Menghasilkan JSON single-line terstruktur ke stdout/stderr yang langsung
 * dikenali dan diparsing otomatis oleh Google Cloud Logging (Cloud Run / App Engine / GKE).
 *
 * Spesifikasi field GCP:
 * - severity: "DEFAULT" | "DEBUG" | "INFO" | "NOTICE" | "WARNING" | "ERROR" | "CRITICAL"
 * - message: string deskriptif
 * - logging.googleapis.com/trace: projects/${PROJECT_ID}/traces/${TRACE_ID}
 * - logging.googleapis.com/spanId: hex/dec string
 * - httpRequest: objek request standar GCP
 * - requestId: ID unik korelasi per HTTP request
 */

function generateUUID(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export type LogSeverity =
  | "DEFAULT"
  | "DEBUG"
  | "INFO"
  | "NOTICE"
  | "WARNING"
  | "ERROR"
  | "CRITICAL";

export interface HttpRequestLog {
  requestMethod?: string;
  requestUrl?: string;
  requestSize?: number;
  status?: number;
  responseSize?: number;
  userAgent?: string;
  remoteIp?: string;
  serverIp?: string;
  referer?: string;
  latency?: string;
  protocol?: string;
}

export interface GcpLogPayload {
  severity: LogSeverity;
  message: string;
  timestamp?: string;
  "logging.googleapis.com/trace"?: string;
  "logging.googleapis.com/spanId"?: string;
  "logging.googleapis.com/trace_sampled"?: boolean;
  httpRequest?: HttpRequestLog;
  requestId?: string;
  error?: {
    name?: string;
    message: string;
    stack?: string;
  };
  [key: string]: unknown;
}

export interface FormatGcpLogOptions {
  severity: LogSeverity;
  message: string;
  projectId?: string;
  traceId?: string;
  spanId?: string;
  traceSampled?: boolean;
  requestId?: string;
  httpRequest?: HttpRequestLog;
  error?: unknown;
  meta?: Record<string, unknown>;
}

export interface TraceContext {
  traceId?: string;
  spanId?: string;
  sampled?: boolean;
}

/**
 * Parsing header X-Cloud-Trace-Context dari Google Cloud Load Balancer / App Engine:
 * Format: TRACE_ID[/SPAN_ID][;o=TRACE_TRUE]
 */
export function parseTraceContext(header?: string | null): TraceContext {
  if (!header || typeof header !== "string") return {};

  const [traceAndSpan, options] = header.trim().split(";");
  const [traceId, spanId] = traceAndSpan.split("/");

  let sampled = false;
  if (options) {
    const opts = options.split(",");
    for (const opt of opts) {
      if (opt.startsWith("o=")) {
        sampled = opt.slice(2) === "1";
      }
    }
  }

  return {
    traceId: traceId ? traceId.trim() : undefined,
    spanId: spanId ? spanId.trim() : undefined,
    sampled,
  };
}

/**
 * Format payload log sesuai standar Google Cloud Logging.
 */
export function formatGcpLog(opts: FormatGcpLogOptions): GcpLogPayload {
  const gcpProjectId =
    opts.projectId ||
    process.env.GOOGLE_CLOUD_PROJECT ||
    process.env.FIREBASE_PROJECT_ID ||
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
    "store-asinan";

  const entry: GcpLogPayload = {
    severity: opts.severity,
    message: opts.message,
    timestamp: new Date().toISOString(),
  };

  if (opts.traceId) {
    entry["logging.googleapis.com/trace"] = `projects/${gcpProjectId}/traces/${opts.traceId}`;
  }

  if (opts.spanId) {
    entry["logging.googleapis.com/spanId"] = opts.spanId;
  }

  if (opts.traceSampled !== undefined) {
    entry["logging.googleapis.com/trace_sampled"] = opts.traceSampled;
  }

  if (opts.requestId) {
    entry.requestId = opts.requestId;
  }

  if (opts.httpRequest) {
    entry.httpRequest = opts.httpRequest;
  }

  if (opts.error) {
    if (opts.error instanceof Error) {
      entry.error = {
        name: opts.error.name,
        message: opts.error.message,
        stack: opts.error.stack,
      };
    } else {
      entry.error = {
        message: String(opts.error),
      };
    }
  }

  if (opts.meta) {
    for (const [key, val] of Object.entries(opts.meta)) {
      if (!(key in entry)) {
        entry[key] = val;
      }
    }
  }

  return entry;
}

export interface LoggerContext {
  requestId?: string;
  traceId?: string;
  spanId?: string;
  traceSampled?: boolean;
}

export interface Logger {
  info(message: string, meta?: Record<string, unknown>): void;
  warn(message: string, meta?: Record<string, unknown>): void;
  error(message: string, error?: unknown, meta?: Record<string, unknown>): void;
  debug(message: string, meta?: Record<string, unknown>): void;
  http(message: string, httpRequest: HttpRequestLog, meta?: Record<string, unknown>): void;
  child(context: LoggerContext): Logger;
}

function emitLog(entry: GcpLogPayload) {
  const line = JSON.stringify(entry);
  if (entry.severity === "ERROR" || entry.severity === "CRITICAL") {
    console.error(line);
  } else {
    console.log(line);
  }
}

/**
 * Buat instance logger dengan konteks trace & requestId tertentu.
 */
export function createLogger(initialContext: LoggerContext = {}): Logger {
  let ctx: LoggerContext = {
    requestId: initialContext.requestId || generateUUID(),
    traceId: initialContext.traceId,
    spanId: initialContext.spanId,
    traceSampled: initialContext.traceSampled,
  };

  return {
    info(message, meta) {
      emitLog(
        formatGcpLog({
          severity: "INFO",
          message,
          requestId: ctx.requestId,
          traceId: ctx.traceId,
          spanId: ctx.spanId,
          traceSampled: ctx.traceSampled,
          meta,
        })
      );
    },
    warn(message, meta) {
      emitLog(
        formatGcpLog({
          severity: "WARNING",
          message,
          requestId: ctx.requestId,
          traceId: ctx.traceId,
          spanId: ctx.spanId,
          traceSampled: ctx.traceSampled,
          meta,
        })
      );
    },
    error(message, error, meta) {
      emitLog(
        formatGcpLog({
          severity: "ERROR",
          message,
          error,
          requestId: ctx.requestId,
          traceId: ctx.traceId,
          spanId: ctx.spanId,
          traceSampled: ctx.traceSampled,
          meta,
        })
      );
    },
    debug(message, meta) {
      emitLog(
        formatGcpLog({
          severity: "DEBUG",
          message,
          requestId: ctx.requestId,
          traceId: ctx.traceId,
          spanId: ctx.spanId,
          traceSampled: ctx.traceSampled,
          meta,
        })
      );
    },
    http(message, httpRequest, meta) {
      emitLog(
        formatGcpLog({
          severity: (httpRequest.status || 200) >= 500 ? "ERROR" : "INFO",
          message,
          httpRequest,
          requestId: ctx.requestId,
          traceId: ctx.traceId,
          spanId: ctx.spanId,
          traceSampled: ctx.traceSampled,
          meta,
        })
      );
    },
    child(newCtx: LoggerContext) {
      return createLogger({
        requestId: newCtx.requestId || ctx.requestId,
        traceId: newCtx.traceId || ctx.traceId,
        spanId: newCtx.spanId || ctx.spanId,
        traceSampled: newCtx.traceSampled ?? ctx.traceSampled,
      });
    },
  };
}

/** Default singleton logger */
export const logger = createLogger();
