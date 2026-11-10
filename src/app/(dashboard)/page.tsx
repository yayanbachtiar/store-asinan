import Link from "next/link";
import { DbUnavailable, StatCard } from "@/components/ui";
import { getBatchDetail, listBatches } from "@/lib/data";
import { formatPct, formatRp } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  let content: React.ReactNode;
  try {
    const allBatches = await listBatches();
    const active = allBatches.find((b) => b.status === "aktif") ?? allBatches[0];
    const details = await Promise.all(allBatches.map((b) => getBatchDetail(b.id)));
    const cumulativeCost = details.reduce((s, d) => s + (d?.finance.totalExpenses ?? 0), 0);
    const cumulativeProfit = details.reduce((s, d) => s + (d?.finance.profit ?? 0), 0);
    const cumulativeRoi =
      cumulativeCost > 0 ? Math.round((cumulativeProfit / cumulativeCost) * 10000) / 100 : null;

    const activeDetail = active ? details.find((d) => d?.batch.id === active.id) : null;
    const f = activeDetail?.finance;

    content = (
      <>
        <h1 className="text-xl font-bold">Ringkasan</h1>
        {!active || !f ? (
          <p className="mt-4 rounded-2xl bg-white p-4 text-sm shadow-sm">
            Belum ada batch. Buat batch pertama di halaman{" "}
            <Link className="font-semibold text-amber-700 underline" href="/batch">
              Batch
            </Link>
            .
          </p>
        ) : (
          <>
            <p className="mt-1 text-sm text-stone-500">
              Batch {active.status === "aktif" ? "aktif" : "terakhir"}:{" "}
              <Link className="font-semibold text-amber-700 underline" href={`/batch/${active.id}`}>
                {active.title ?? `Batch ${active.date}`} ({active.date})
              </Link>
            </p>
            <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-3">
              <StatCard label="Omzet batch" value={formatRp(f.omzet)} />
              <StatCard label="Biaya produksi" value={formatRp(f.totalExpenses)} />
              <StatCard label="Laba batch" value={formatRp(f.profit)} />
              <StatCard
                label="ROI atas biaya (per batch)"
                value={formatPct(f.roiOnCostPct)}
                sub={`Margin omzet ${formatPct(f.marginOnRevenuePct)}`}
              />
              <StatCard label="Piutang (belum bayar)" value={formatRp(f.totalReceivable)} />
              <StatCard
                label="Belum disetor ke bendahara"
                value={formatRp(f.totalUnsettled)}
                sub={`Kas bendahara ${formatRp(f.treasurerCash)}`}
              />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <StatCard
                label="ROI kumulatif semua batch"
                value={formatPct(cumulativeRoi)}
                sub={`Total laba ${formatRp(cumulativeProfit)} dari biaya ${formatRp(cumulativeCost)}`}
              />
              <StatCard
                label="Talangan belum diganti (batch ini)"
                value={formatRp(f.outstandingAdvances)}
              />
            </div>
          </>
        )}
      </>
    );
  } catch {
    content = <DbUnavailable />;
  }
  return content;
}
