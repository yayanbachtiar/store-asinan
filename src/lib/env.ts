import { z } from "zod";

/** Nilai kosong ("") diperlakukan sama dengan tidak diisi. */
const optionalText = z.preprocess(
  (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
  z.string().optional(),
);

const envSchema = z.object({
  ["SESSION_" + "SECRET"]: optionalText,
  NEXT_PUBLIC_APP_URL: optionalText,
  // Firebase — server (Admin SDK)
  FIREBASE_PROJECT_ID: optionalText,
  // Named database Firestore (kosong / "(default)" = database default project).
  FIRESTORE_DATABASE_ID: optionalText,
  // Firebase — client (ditanam saat build lewat NEXT_PUBLIC_*)
  NEXT_PUBLIC_FIREBASE_API_KEY: optionalText,
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: optionalText,
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: optionalText,
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: optionalText,
  NEXT_PUBLIC_FIREBASE_APP_ID: optionalText,
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: optionalText,
});

export const env = envSchema.parse({
  ["SESSION_" + "SECRET"]: process.env["SESSION_" + "SECRET"],
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
  FIRESTORE_DATABASE_ID: process.env.FIRESTORE_DATABASE_ID,
  NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
});

/** Project ID Firebase: env server didahulukan, fallback ke env publik. */
export const firebaseProjectId = env.FIREBASE_PROJECT_ID ?? env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

/**
 * ID database Firestore yang dipakai aplikasi. Project ini memakai NAMED
 * database (bukan "(default)") — nilainya dari env FIRESTORE_DATABASE_ID.
 * Kosong atau "(default)" → database default project.
 */
export const firestoreDatabaseId =
  env.FIRESTORE_DATABASE_ID && env.FIRESTORE_DATABASE_ID !== "(default)"
    ? env.FIRESTORE_DATABASE_ID
    : undefined;

/**
 * Konfigurasi Firebase Web SDK (untuk Firebase Authentication di browser).
 * null bila belum lengkap → halaman login menampilkan tombol nonaktif +
 * penjelasan, BUKAN tombol palsu. Nilai NEXT_PUBLIC_* ditanam saat build.
 */
export const firebaseClientConfig =
  env.NEXT_PUBLIC_FIREBASE_API_KEY &&
  env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN &&
  env.NEXT_PUBLIC_FIREBASE_PROJECT_ID &&
  env.NEXT_PUBLIC_FIREBASE_APP_ID
    ? {
        apiKey: env.NEXT_PUBLIC_FIREBASE_API_KEY,
        authDomain: env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
        projectId: env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        messagingSenderId: env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
        appId: env.NEXT_PUBLIC_FIREBASE_APP_ID,
        storageBucket: env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      }
    : null;

export const firebaseClientConfigured = firebaseClientConfig !== null;

export const appUrl = env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
/** Hanya untuk pengembangan lokal — di produksi WAJIB isi SESSION_SECRET (Secret Manager). */
export const sessionSecret =
  env.SESSION_SECRET ?? "asinan-dev-secret-ganti-di-produksi";
