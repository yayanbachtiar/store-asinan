import { NextResponse, type NextRequest } from "next/server";
import { formatGcpLog, parseTraceContext } from "./lib/logger";

const PROTECTED_PREFIXES = ["/batch", "/piutang", "/kas", "/pelanggan", "/pengaturan"];

function isProtectedPath(pathname: string): boolean {
  if (pathname === "/") return true;
  return PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

// Penjaga ringan di edge:
// 1. Ekstrak / buat Request ID & Trace ID standar GCP
// 2. Proteksi rute dashboard (redirect jika belum login)
// 3. Catat GCP Structured HTTP Access Log (httpRequest format)
export function middleware(request: NextRequest) {
  const startTime = Date.now();
  const pathname = request.nextUrl.pathname;

  // 1. Ekstrak atau buat Request ID & Trace ID
  const incomingReqId = request.headers.get("x-request-id");
  const requestId =
    incomingReqId && incomingReqId.trim() ? incomingReqId.trim() : crypto.randomUUID();

  const traceHeader = request.headers.get("x-cloud-trace-context");
  const { traceId: gcpTraceId, spanId, sampled } = parseTraceContext(traceHeader);
  const traceId = gcpTraceId || requestId.replace(/-/g, "");

  // 2. Cek sesi untuk halaman terproteksi
  const hasSession = request.cookies.has("asinan_session");
  if (isProtectedPath(pathname) && !hasSession) {
    const redirectUrl = new URL("/login", request.url);
    const redirectRes = NextResponse.redirect(redirectUrl);
    redirectRes.headers.set("x-request-id", requestId);
    redirectRes.headers.set("x-trace-id", traceId);

    // GCP Log redirect
    const duration = ((Date.now() - startTime) / 1000).toFixed(3) + "s";
    const logLine = JSON.stringify(
      formatGcpLog({
        severity: "INFO",
        message: `${request.method} ${pathname} 307 (Redirect to /login)`,
        requestId,
        traceId,
        spanId,
        traceSampled: sampled,
        httpRequest: {
          requestMethod: request.method,
          requestUrl: request.url,
          status: 307,
          userAgent: request.headers.get("user-agent") || undefined,
          remoteIp: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || undefined,
          referer: request.headers.get("referer") || undefined,
          latency: duration,
          protocol: request.nextUrl.protocol,
        },
      })
    );
    console.log(logLine);
    return redirectRes;
  }

  // 3. Teruskan header ke downstream Server Components & Route Handlers
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-request-id", requestId);
  requestHeaders.set("x-trace-id", traceId);

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  response.headers.set("x-request-id", requestId);
  response.headers.set("x-trace-id", traceId);

  // 4. GCP Structured HTTP Access Log
  const duration = ((Date.now() - startTime) / 1000).toFixed(3) + "s";
  const logLine = JSON.stringify(
    formatGcpLog({
      severity: "INFO",
      message: `${request.method} ${pathname} 200`,
      requestId,
      traceId,
      spanId,
      traceSampled: sampled,
      httpRequest: {
        requestMethod: request.method,
        requestUrl: request.url,
        status: 200,
        userAgent: request.headers.get("user-agent") || undefined,
        remoteIp: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || undefined,
        referer: request.headers.get("referer") || undefined,
        latency: duration,
        protocol: request.nextUrl.protocol,
      },
    })
  );
  console.log(logLine);

  return response;
}

export const config = {
  matcher: [
    /*
     * Cocokkan semua path kecuali file statis (_next, favicon, gambar)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
