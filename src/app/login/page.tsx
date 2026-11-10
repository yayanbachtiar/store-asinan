import { GoogleLoginButton } from "@/components/google-login-button";
import { firebaseClientConfigured } from "@/lib/env";

export const dynamic = "force-dynamic";

const ERROR_MESSAGES: Record<string, string> = {
  "email-tidak-terdaftar":
    "Email Google kamu belum terdaftar sebagai anggota. Minta anggota yang sudah bisa masuk untuk menambahkan emailmu di halaman Pengaturan.",
  "database-tidak-tersedia": "Database sedang tidak tersedia. Coba lagi sebentar lagi.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-4">
      <div className="rounded-2xl border border-amber-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold">🥒 Kas Asinan</h1>
        <p className="mt-2 text-sm text-stone-600">
          Pencatatan order &amp; keuangan usaha asinan. Masuk dengan akun Google yang sudah
          terdaftar sebagai anggota tim.
        </p>
        {error && (
          <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {ERROR_MESSAGES[error] ?? "Terjadi kesalahan saat login."}
          </p>
        )}
        {firebaseClientConfigured ? (
          <GoogleLoginButton />
        ) : (
          <div className="mt-6">
            <button
              type="button"
              disabled
              className="w-full cursor-not-allowed rounded-lg bg-stone-300 px-4 py-3 font-semibold text-stone-500"
            >
              Masuk dengan Google (belum aktif)
            </button>
            <p className="mt-2 text-xs text-stone-500">
              Tombol ini aktif setelah admin mengisi konfigurasi Firebase (
              <code>NEXT_PUBLIC_FIREBASE_API_KEY</code>, <code>NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN</code>,{" "}
              <code>NEXT_PUBLIC_FIREBASE_PROJECT_ID</code>, <code>NEXT_PUBLIC_FIREBASE_APP_ID</code>)
              saat build/deploy. Tidak ada akun demo — akun pertama didaftarkan langsung di
              collection <code>members</code> Firestore.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
