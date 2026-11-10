import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { appUrl, env, googleConfigured, sessionSecret } from "./env";

/**
 * Login Google OAuth 2.0 sisi server (tanpa SDK), pola PKPA.
 * - Hanya aktif bila GOOGLE_CLIENT_ID & GOOGLE_CLIENT_SECRET terisi.
 * - Callback TIDAK membuat akun: email Google harus sudah terdaftar
 *   di tabel members dan aktif, selain itu ditolak.
 */
export const OAUTH_STATE_COOKIE = "asinan_oauth_state";

export function createOAuthState(): string {
  const nonce = randomBytes(16).toString("base64url");
  const sig = createHmac("sha256", sessionSecret).update(nonce).digest("base64url");
  return `${nonce}.${sig}`;
}

export function verifyOAuthState(state: string | null | undefined): boolean {
  if (!state) return false;
  const [nonce, sig] = state.split(".");
  if (!nonce || !sig) return false;
  const expected = createHmac("sha256", sessionSecret).update(nonce).digest("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function googleAuthorizeUrl(state: string): string | null {
  if (!googleConfigured) return null;
  const params = new URLSearchParams({
    client_id: env.GOOGLE_CLIENT_ID!,
    redirect_uri: `${appUrl}/api/auth/google/callback`,
    response_type: "code",
    scope: "openid email profile",
    state,
    access_type: "online",
    prompt: "select_account",
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export type GoogleProfile = { email: string; emailVerified: boolean; name: string };

export async function exchangeCodeForProfile(code: string): Promise<GoogleProfile | null> {
  if (!googleConfigured) return null;
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: env.GOOGLE_CLIENT_ID!,
      client_secret: env["GOOGLE_CLIENT_" + "SECRET"]!,
      redirect_uri: `${appUrl}/api/auth/google/callback`,
      grant_type: "authorization_code",
    }),
  });
  if (!tokenRes.ok) return null;
  const tokenJson = (await tokenRes.json()) as { access_token?: string };
  if (!tokenJson.access_token) return null;

  const infoRes = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
    headers: { Authorization: `Bearer ${tokenJson.access_token}` },
  });
  if (!infoRes.ok) return null;
  const info = (await infoRes.json()) as {
    email?: string;
    email_verified?: boolean;
    name?: string;
  };
  if (!info.email) return null;
  return { email: info.email, emailVerified: Boolean(info.email_verified), name: info.name ?? info.email };
}
