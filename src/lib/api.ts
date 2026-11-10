import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiMember, type SessionMember } from "./auth";

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
