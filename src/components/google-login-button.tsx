"use client";

import { useState } from "react";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { getClientAuth } from "@/lib/firebase-client";

const ERROR_MESSAGES: Record<string, string> = {
  "email-tidak-terdaftar":
    "Email Google kamu belum terdaftar sebagai anggota. Minta anggota yang sudah bisa masuk untuk menambahkan emailmu di halaman Pengaturan.",
  "database-tidak-tersedia": "Database sedang tidak tersedia. Coba lagi sebentar lagi.",
  "auth-gagal": "Login Google gagal atau dibatalkan. Silakan coba lagi.",
};

/**
 * Alur login Firebase Authentication:
 * popup Google → ID token → POST /api/auth/firebase (server memverifikasi
 * token via Admin SDK + cek whitelist members) → cookie sesi → dashboard.
 */
export function GoogleLoginButton() {
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleLogin() {
    const auth = getClientAuth();
    if (!auth) {
      setError(ERROR_MESSAGES["auth-gagal"]);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const result = await signInWithPopup(auth, new GoogleAuthProvider());
      const idToken = await result.user.getIdToken();
      const res = await fetch("/api/auth/firebase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) {
        setError(ERROR_MESSAGES[data?.error ?? ""] ?? ERROR_MESSAGES["auth-gagal"]);
        setBusy(false);
        return;
      }
      window.location.href = "/";
    } catch {
      setError(ERROR_MESSAGES["auth-gagal"]);
      setBusy(false);
    }
  }

  return (
    <div className="mt-6">
      <button
        type="button"
        onClick={handleLogin}
        disabled={busy}
        className="w-full rounded-lg bg-amber-600 px-4 py-3 text-center font-semibold text-white hover:bg-amber-700 disabled:opacity-50"
      >
        {busy ? "Memproses…" : "Masuk dengan Google"}
      </button>
      {error && (
        <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}
    </div>
  );
}
