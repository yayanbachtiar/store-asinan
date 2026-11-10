import { googleConfigured } from "@/lib/env";

export const dynamic = "force-dynamic";

const ERROR_MESSAGES: Record<string, string> = {
  "email-tidak-terdaftar":
    "Email Google kamu belum terdaftar sebagai anggota. Minta anggota yang sudah bisa masuk untuk menambahkan emailmu di halaman Pengaturan.",
  "oauth-gagal": "Login Google gagal atau dibatalkan. Silakan coba lagi.",
  "google-belum-dikonfigurasi": "Login Google belum dikonfigurasi di server.",
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
        {googleConfigured ? (
          <a
            href="/api/auth/google"
            className="mt-6 block rounded-lg bg-amber-600 px-4 py-3 text-center font-semibold text-white hover:bg-amber-700"
          >
            Masuk dengan Google
          </a>
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
              Tombol ini aktif setelah admin mengisi <code>GOOGLE_CLIENT_ID</code> dan{" "}
              <code>GOOGLE_CLIENT_SECRET</code> di server. Tidak ada akun demo — akun pertama
              didaftarkan langsung di tabel <code>members</code> database.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
