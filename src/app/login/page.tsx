import { GoogleLoginButton } from "@/components/google-login-button";
import { firebaseClientConfigured } from "@/lib/env";
import { CuteBananaMascot } from "@/components/CuteBananaMascot";

export const dynamic = "force-dynamic";

const ERROR_MESSAGES: Record<string, string> = {
  "email-tidak-terdaftar":
    "Email Google kamu belum terdaftar sebagai anggota. Minta bendahara atau anggota tim untuk mendaftarkan emailmu di menu Pengaturan ya!",
  "database-tidak-tersedia": "Database sedang istirahat sebentar. Coba muat ulang halaman ya.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main className="relative flex min-h-screen w-full flex-col items-center justify-center bg-[#FFFDF9] px-4 py-12 selection:bg-pink-200">
      {/* Background ambient pastel blooms */}
      <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 h-96 w-96 rounded-full bg-pink-100/60 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 right-10 h-72 w-72 rounded-full bg-amber-100/40 blur-3xl" />

      <div className="relative w-full max-w-md rounded-3xl border border-pink-200/90 bg-white/90 p-8 shadow-sm shadow-pink-100/50 backdrop-blur-xs text-center transition-all">
        {/* Cute Mascot Header */}
        <div className="mx-auto flex h-24 w-24 items-center justify-center">
          <CuteBananaMascot variant="welcome" size={88} />
        </div>

        <div className="inline-flex items-center gap-1.5 rounded-full bg-pink-50 border border-pink-200/80 px-3 py-1 text-xs font-bold text-pink-700 mt-2">
          <span>✨</span>
          <span>Kas Asinan Studio</span>
        </div>

        <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-[#2D1B2D]">
          Selamat Datang!
        </h1>
        <p className="mt-1.5 text-xs text-[#7A6273] leading-relaxed max-w-xs mx-auto">
          Catat order, pantau modal, hitung laba bersih, dan pantau keuangan bisnis asinan buah bersama tim.
        </p>

        {error && (
          <div className="mt-4 rounded-2xl bg-rose-50 border border-rose-200 p-3 text-xs font-medium text-rose-700 text-left flex items-start gap-2">
            <span className="text-sm">⚠️</span>
            <span>{ERROR_MESSAGES[error] ?? "Terjadi kesalahan saat login."}</span>
          </div>
        )}

        <div className="mt-6">
          {firebaseClientConfigured ? (
            <GoogleLoginButton />
          ) : (
            <div className="space-y-3">
              <button
                type="button"
                disabled
                className="w-full cursor-not-allowed rounded-full bg-stone-100 border border-stone-200 px-4 py-3 text-xs font-bold text-stone-400"
              >
                Masuk dengan Google (Konfigurasi Belum Lengkap)
              </button>
              <div className="rounded-2xl bg-amber-50/70 border border-amber-200/60 p-3 text-left">
                <p className="text-[11px] text-amber-900 leading-relaxed">
                  Tombol ini aktif otomatis setelah env Firebase Client diisi (<code>NEXT_PUBLIC_FIREBASE_API_KEY</code>, dll). Akun anggota whitelist didaftarkan di collection <code>members</code>.
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="mt-8 border-t border-pink-100 pt-4 text-center">
          <p className="text-[11px] text-[#A892A2]">
            🌸 Fresh • Crispy • Cute Financial Tracker
          </p>
        </div>
      </div>
    </main>
  );
}
