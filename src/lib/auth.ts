import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { members } from "@/db/schema";
import { sessionSecret } from "./env";

/**
 * Sesi dashboard: cookie bertanda tangan HMAC berisi member id.
 * Pola sama seperti PKPA — email harus terdaftar di tabel members
 * (whitelist), TANPA pembuatan akun otomatis, TANPA akun demo.
 */
export const SESSION_COOKIE = "asinan_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;

export type SessionMember = {
  id: number;
  name: string;
  email: string;
  role: "bendahara" | "anggota";
};

function sign(payload: string): string {
  return createHmac("sha256", sessionSecret).update(payload).digest("base64url");
}

export function createSessionToken(member: SessionMember): string {
  const payload = Buffer.from(
    JSON.stringify({ ...member, exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS }),
  ).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function readSessionToken(token: string | undefined): SessionMember | null {
  if (!token) return null;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;
  const a = Buffer.from(signature);
  const b = Buffer.from(sign(payload));
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as SessionMember & {
      exp?: number;
    };
    if (!data.exp || data.exp < Math.floor(Date.now() / 1000)) return null;
    return { id: data.id, name: data.name, email: data.email, role: data.role };
  } catch {
    return null;
  }
}

export async function setSession(member: SessionMember): Promise<void> {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, createSessionToken(member), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
    secure: process.env.NODE_ENV === "production",
  });
}

export async function clearSession(): Promise<void> {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
}

/**
 * Member yang sedang login, divalidasi ulang ke DB (akun nonaktif / terhapus
 * langsung kehilangan akses). Bila DB sedang tidak terjangkau, token sesi
 * yang valid tetap diterima (fail-open tercatat, pola PKPA) agar dashboard
 * tidak terkunci total saat DB bermasalah sesaat.
 */
export async function getCurrentMember(): Promise<SessionMember | null> {
  const jar = await cookies();
  const tokenMember = readSessionToken(jar.get(SESSION_COOKIE)?.value);
  if (!tokenMember) return null;
  try {
    const [row] = await db
      .select({ id: members.id, name: members.name, email: members.email, role: members.role, isActive: members.isActive })
      .from(members)
      .where(eq(members.id, tokenMember.id))
      .limit(1);
    if (!row || !row.isActive) return null;
    return { id: row.id, name: row.name, email: row.email, role: row.role };
  } catch {
    return tokenMember;
  }
}

/** Untuk route handler API: kembalikan member atau null (penelepon menjawab 401). */
export async function requireApiMember(): Promise<SessionMember | null> {
  return getCurrentMember();
}
