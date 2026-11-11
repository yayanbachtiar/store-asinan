import Link from "next/link";
import { BatchForm } from "@/components/forms";
import { DbUnavailable, CuteEmptyState } from "@/components/ui";
import { listBatches } from "@/lib/data";
import { formatRp } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function BatchListPage() {
  let rows: Awaited<ReturnType<typeof listBatches>> | null = null;
  try {
    rows = await listBatches();
  } catch {
    rows = null;
  }
  if (!rows) return <DbUnavailable />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-[#2D1B2D] flex items-center gap-2">
            <span>🧺</span>
            <span>Batch Produksi</span>
          </h1>
          <p className="text-xs text-[#7A6273] mt-0.5">
            Kelola sesi produksi, catat belanja bahan, dan pantau laba per batch.
          </p>
        </div>
      </div>

      <BatchForm />

      <div className="space-y-3">
        <h2 className="text-sm font-bold text-[#7A6273] uppercase tracking-wider">
          Daftar Batch Terdaftar
        </h2>

        {rows.length === 0 ? (
          <CuteEmptyState
            title="Belum Ada Batch Produksi"
            message="Buat batch produksi pertamamu menggunakan formulir di atas untuk mulai mencatat modal dan orderan asinan."
          />
        ) : (
          <div className="grid gap-3">
            {rows.map((b) => (
              <Link
                key={b.id}
                href={`/batch/${b.id}`}
                className="group flex items-center justify-between rounded-3xl border border-pink-200/80 bg-white p-4.5 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-pink-300 hover:shadow-sm"
              >
                <div className="flex items-center gap-3.5">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-pink-50 border border-pink-100 text-xl group-hover:scale-105 transition-transform">
                    {b.status === "aktif" ? "✨" : "📦"}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-sm text-[#2D1B2D] group-hover:text-pink-600 transition-colors">
                        {b.title ?? `Batch ${b.date}`}
                      </span>
                    </div>
                    <span className="block text-xs text-[#7A6273] mt-0.5">
                      📅 {b.date} · Modal awal <b className="text-[#2D1B2D]">{formatRp(b.initialCapital)}</b>
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${
                      b.status === "aktif"
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200/80"
                        : "bg-stone-100 text-stone-500 border border-stone-200/60"
                    }`}
                  >
                    {b.status === "aktif" && (
                      <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    )}
                    {b.status === "aktif" ? "Aktif" : "Ditutup"}
                  </span>
                  <span className="text-[#A892A2] group-hover:text-pink-500 group-hover:translate-x-0.5 transition-all">
                    →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
