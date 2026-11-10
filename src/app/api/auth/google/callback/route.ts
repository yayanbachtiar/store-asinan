import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { members } from "@/db/schema";
import { appUrl } from "@/lib/env";
import { setSession } from "@/lib/auth";
import { exchangeCodeForProfile, OAUTH_STATE_COOKIE, verifyOAuthState } from "@/lib/google";

export const dynamic = "force-dynamic";

function toLogin(error: string) {
  return NextResponse.redirect(`${appUrl}/login?error=${error}`);
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const jar = await cookies();
  const savedState = jar.get(OAUTH_STATE_COOKIE)?.value;
  jar.delete(OAUTH_STATE_COOKIE);

  if (!code || !verifyOAuthState(state) || state !== savedState) {
    return toLogin("oauth-gagal");
  }
  const profile = await exchangeCodeForProfile(code);
  if (!profile || !profile.emailVerified) {
    return toLogin("oauth-gagal");
  }

  // Whitelist: email WAJIB sudah terdaftar & aktif di tabel members.
  // Tidak ada pembuatan akun otomatis di sini.
  let member: typeof members.$inferSelect | undefined;
  try {
    [member] = await db
      .select()
      .from(members)
      .where(eq(members.email, profile.email.toLowerCase()))
      .limit(1);
  } catch {
    return toLogin("database-tidak-tersedia");
  }
  if (!member || !member.isActive) {
    return toLogin("email-tidak-terdaftar");
  }

  await setSession({ id: member.id, name: member.name, email: member.email, role: member.role });
  return NextResponse.redirect(`${appUrl}/`);
}
