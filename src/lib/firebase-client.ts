import { getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { firebaseClientConfig } from "./env";

/**
 * Firebase Web SDK — HANYA untuk Firebase Authentication di browser
 * (signInWithPopup Google → ID token → diverifikasi server via Admin SDK).
 * Data aplikasi tidak pernah dibaca/ditulis dari client; semua lewat API
 * server + Admin SDK. Mengembalikan null bila env NEXT_PUBLIC_FIREBASE_*
 * belum lengkap, supaya halaman login bisa menampilkan keadaan nonaktif.
 */
let app: FirebaseApp | null = null;

export function getClientAuth(): Auth | null {
  if (!firebaseClientConfig) return null;
  app ??= getApps()[0] ?? initializeApp(firebaseClientConfig);
  return getAuth(app);
}
