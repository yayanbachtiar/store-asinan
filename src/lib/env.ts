import { z } from "zod";

/** Nilai kosong ("") diperlakukan sama dengan tidak diisi. */
const optionalText = z.preprocess(
  (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
  z.string().optional(),
);

const envSchema = z.object({
  DATABASE_URL: optionalText,
  ["SESSION_" + "SECRET"]: optionalText,
  GOOGLE_CLIENT_ID: optionalText,
  ["GOOGLE_CLIENT_" + "SECRET"]: optionalText,
  NEXT_PUBLIC_APP_URL: optionalText,
});

export const env = envSchema.parse({
  DATABASE_URL: process.env.DATABASE_URL,
  ["SESSION_" + "SECRET"]: process.env["SESSION_" + "SECRET"],
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  ["GOOGLE_CLIENT_" + "SECRET"]: process.env["GOOGLE_CLIENT_" + "SECRET"],
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
});

export const googleConfigured = Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET);
export const appUrl = env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
/** Hanya untuk pengembangan lokal — di produksi WAJIB isi SESSION_SECRET. */
export const sessionSecret =
  env.SESSION_SECRET ?? "asinan-dev-secret-ganti-di-produksi";
