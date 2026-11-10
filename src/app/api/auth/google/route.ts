import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { appUrl } from "@/lib/env";
import { createOAuthState, googleAuthorizeUrl, OAUTH_STATE_COOKIE } from "@/lib/google";

export const dynamic = "force-dynamic";

export async function GET() {
  const url = googleAuthorizeUrl(createOAuthState());
  if (!url) {
    return NextResponse.redirect(`${appUrl}/login?error=google-belum-dikonfigurasi`);
  }
  const state = new URL(url).searchParams.get("state")!;
  const jar = await cookies();
  jar.set(OAUTH_STATE_COOKIE, state, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 600,
    secure: process.env.NODE_ENV === "production",
  });
  return NextResponse.redirect(url);
}
