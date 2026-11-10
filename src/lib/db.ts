import { applicationDefault, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { firebaseProjectId } from "./env";

/**
 * Akses Firestore lewat Firebase Admin SDK — HANYA di server.
 *
 * - Di Cloud Run: Admin SDK memakai service account bawaan runtime lewat
 *   Application Default Credentials — TANPA file kunci sama sekali.
 * - Lokal: set GOOGLE_APPLICATION_CREDENTIALS ke file kunci service account,
 *   ATAU jalankan Firestore Emulator dan set FIRESTORE_EMULATOR_HOST.
 * - Project ID dari env FIREBASE_PROJECT_ID / NEXT_PUBLIC_FIREBASE_PROJECT_ID.
 *
 * Inisialisasi MALAS (lazy) dan kegagalannya ditangkap: `next build` dan
 * halaman publik tetap aman berjalan saat Firebase belum dikonfigurasi.
 * Penelepon (repository) melempar Error lewat getDb() → halaman dashboard
 * menampilkan keadaan "database belum tersedia" (pola nextjs_ghcr_deploy).
 */

type AdminServices = { app: App; firestore: Firestore; auth: Auth };

let cached: AdminServices | null | undefined;
let override: Firestore | null = null;

function initAdmin(): AdminServices | null {
  if (cached !== undefined) return cached;
  try {
    const emulatorHost = process.env.FIRESTORE_EMULATOR_HOST;
    const projectId = firebaseProjectId ?? (emulatorHost ? "demo-kas-asinan" : undefined);
    if (!projectId) {
      cached = null;
      return null;
    }
    const app =
      getApps()[0] ??
      initializeApp(
        emulatorHost
          ? { projectId } // Emulator tidak butuh kredensial.
          : { projectId, credential: applicationDefault() },
      );
    cached = { app, firestore: getFirestore(app), auth: getAuth(app) };
  } catch {
    cached = null;
  }
  return cached;
}

/** Firestore siap pakai, atau lempar Error bila belum terkonfigurasi. */
export function getDb(): Firestore {
  if (override) return override;
  const services = initAdmin();
  if (!services) {
    throw new Error(
      "Firestore belum terkonfigurasi (isi FIREBASE_PROJECT_ID / NEXT_PUBLIC_FIREBASE_PROJECT_ID, atau FIRESTORE_EMULATOR_HOST untuk lokal)",
    );
  }
  return services.firestore;
}

/** Admin Auth untuk verifikasi ID token Firebase — null bila belum terkonfigurasi. */
export function getAdminAuth(): Auth | null {
  return initAdmin()?.auth ?? null;
}

export function isFirestoreConfigured(): boolean {
  return override !== null || initAdmin() !== null;
}

/** Khusus test: suntik implementasi Firestore palsu (in-memory). */
export function setFirestoreForTests(fake: Firestore | null): void {
  override = fake;
}
