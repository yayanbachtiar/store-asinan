import { NextResponse } from "next/server";
import { z } from "zod";
import { setSession } from "@/lib/auth";
import { getAdminAuth } from "@/lib/db";
import { findMemberByEmail } from "@/lib/repo/members";

export const dynamic = "force-dynamic";

const bodySchema = z.object({ idToken: z.string().min(1) });

/**
 * Verifikasi login Firebase Authentication:
 * ID token dari client diverifikasi Admin SDK → email harus SUDAH terdaftar
 * & aktif di collection members (whitelist). TIDAK ada pembuatan akun
 * otomatis di sini. Sukses → cookie sesi HMAC berisi member id.
 */
export async function POST(request: Request) {
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "auth-gagal" }, { status: 400 });
  }

  const adminAuth = getAdminAuth();
  if (!adminAuth) {
    return NextResponse.json({ error: "database-tidak-tersedia" }, { status: 503 });
  }

  let email: string | null = null;
  let emailVerified = false;
  try {
    const decoded = await adminAuth.verifyIdToken(parsed.data.idToken);
    email = decoded.email ?? null;
    emailVerified = Boolean(decoded.email_verified);
  } catch {
    return NextResponse.json({ error: "auth-gagal" }, { status: 401 });
  }
  if (!email || !emailVerified) {
    return NextResponse.json({ error: "auth-gagal" }, { status: 401 });
  }

  let member;
  try {
    member = await findMemberByEmail(email);
  } catch {
    return NextResponse.json({ error: "database-tidak-tersedia" }, { status: 503 });
  }
  if (!member || !member.isActive) {
    return NextResponse.json({ error: "email-tidak-terdaftar" }, { status: 403 });
  }

  await setSession({ id: member.id, name: member.name, email: member.email, role: member.role });
  return NextResponse.json({ ok: true });
}
