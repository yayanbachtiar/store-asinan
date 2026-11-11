import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { z } from "zod";
import { requireApiMember, type SessionMember } from "./auth";
import { createLogger, parseTraceContext, type Logger } from "./logger";

export async function getRequestLogger(): Promise<Logger> {
  try {
    const reqHeaders = await headers();
    const requestId = reqHeaders.get("x-request-id") || undefined;
    const traceHeader = reqHeaders.get("x-cloud-trace-context");
    const parsedTrace = parseTraceContext(traceHeader);
    const traceId = parsedTrace.traceId || reqHeaders.get("x-trace-id") || undefined;

    return createLogger({
      requestId,
      traceId,
      spanId: parsedTrace.spanId,
      traceSampled: parsedTrace.sampled,
    });
  } catch {
    return createLogger();
  }
}

export async function guardApi(): Promise<
  { member: SessionMember } | { response: NextResponse }
> {
  const member = await requireApiMember();
  if (!member) {
    return { response: NextResponse.json({ error: "Belum login" }, { status: 401 }) };
  }
  return { member };
}

export function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

export function parseBody<T>(schema: z.ZodType<T>, body: unknown): T | null {
  const result = schema.safeParse(body);
  return result.success ? result.data : null;
}

/** ID route param = ID dokumen Firestore (string); cukup pastikan tidak kosong. */
export const idParam = (raw: string): string | null => {
  const trimmed = raw.trim();
  return trimmed.length > 0 ? trimmed : null;
};
