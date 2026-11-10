import Link from "next/link";
import { BatchForm } from "@/components/forms";
import { DbUnavailable } from "@/components/ui";
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
    <>
      <h1 className="mb-4 text-xl font-bold">Batch Produksi</h1>
      <BatchForm />
      <div className="mt-5 space-y-2">
        {rows.length === 0 && <p className="text-sm text-stone-500">Belum ada batch.</p>}
        {rows.map((b) => (
          <Link
            key={b.id}
            href={`/batch/${b.id}`}
            className="flex items-center justify-between rounded-2xl border border-amber-200 bg-white p-4 shadow-sm hover:bg-amber-100"
          >
            <span>
              <span className="font-semibold">{b.title ?? `Batch ${b.date}`}</span>
              <span className="block text-xs text-stone-500">
                {b.date} · Modal awal {formatRp(b.initialCapital)}
              </span>
            </span>
            <span
              className={`rounded-full px-2 py-1 text-xs font-semibold ${
                b.status === "aktif" ? "bg-emerald-100 text-emerald-700" : "bg-stone-200 text-stone-600"
              }`}
            >
              {b.status === "aktif" ? "Aktif" : "Ditutup"}
            </span>
          </Link>
        ))}
      </div>
    </>
  );
}
