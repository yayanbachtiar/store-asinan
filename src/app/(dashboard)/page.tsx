import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentMember } from "@/lib/auth";
import {
  getBatchDetail,
  listBatches,
  listCustomers,
  listMembers,
  listProducts,
} from "@/lib/data";
import { formatPct, formatRp } from "@/lib/format";
import { DbUnavailable, StatCard } from "@/components/ui";
import { CommandCenterView } from "@/components/command-center/CommandCenterView";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const member = await getCurrentMember();
  if (!member) redirect("/login");

  let content: React.ReactNode;
  try {
    const allBatches = await listBatches();
    const active = allBatches.find((b) => b.status === "aktif");

    if (!active) {
      const hasClosedBatches = allBatches.length > 0;
      return (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-xs text-center max-w-md mx-auto my-8">
          <span className="text-3xl">📦</span>
          <p className="mt-3 text-base font-bold text-slate-800">
            {hasClosedBatches ? "Tidak Ada Batch Produksi Aktif" : "Belum Ada Batch Produksi"}
          </p>
          <p className="mt-1.5 text-xs text-slate-500">
            {hasClosedBatches
              ? "Semua batch sebelumnya sudah ditutup. Buka batch baru untuk mulai mencatat penjualan dan pengeluaran."
              : "Mulai pembukuan dengan membuka batch produksi perdana."}
          </p>
          <div className="mt-5 flex justify-center gap-3">
            <Link
              href="/batch"
              className="inline-flex items-center rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700 transition-colors"
            >
              + Buka Batch Baru
            </Link>
            {hasClosedBatches && (
              <Link
                href={`/batch/${allBatches[0].id}`}
                className="inline-flex items-center rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-medium text-slate-700 hover:bg-slate-100 transition-colors"
              >
                Lihat Batch Terakhir
              </Link>
            )}
          </div>
        </div>
      );
    }

    const [activeDetail, products, customers, members] = await Promise.all([
      getBatchDetail(active.id),
      listProducts(),
      listCustomers(),
      listMembers(),
    ]);

    if (!activeDetail) {
      return <DbUnavailable />;
    }

    const { finance: f, orders, expenses } = activeDetail;
    const totalCups = orders
      .flatMap((o) => o.items)
      .reduce((sum, item) => sum + item.qty, 0);
    const unpaidCount = orders.filter((o) => o.paymentStatus === "belum").length;
    const paidCount = orders.filter((o) => o.paymentStatus === "sudah").length;

    content = (
      <div className="space-y-6">
        {/* Page Title & Context */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/60 pb-3">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Financial Command Center
            </h1>
            <p className="text-xs text-slate-500">
              Monitoring omset, arus kas, dan piutang penjualan harian
            </p>
          </div>
          <span className="text-xs font-medium text-slate-500">
            {active.date} · Modal {formatRp(active.initialCapital)}
          </span>
        </div>

        {/* Zona 1: KPI Summary Cards */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard
            label="Omset Batch"
            value={formatRp(f.omzet)}
            sub={`${paidCount} order lunas`}
          />
          <StatCard
            label="Piutang (Tempo)"
            value={formatRp(f.totalReceivable)}
            sub={`${unpaidCount} belum bayar`}
          />
          <StatCard
            label="Porsi / Cup Terjual"
            value={`${totalCups} Cup`}
            sub={`dari ${orders.length} order`}
          />
          <StatCard
            label="Laba Bersih"
            value={formatRp(f.profit)}
            sub={`Margin ${formatPct(f.marginOnRevenuePct)}`}
          />
        </div>

        {/* Zona 2 & Zona 3: Interactive Command Center */}
        <CommandCenterView
          batchId={active.id}
          batchTitle={active.title ?? `Batch ${active.date}`}
          batchStatus={active.status}
          products={products}
          customers={customers}
          members={members}
          currentMemberId={member.id}
          orders={orders}
          expenses={expenses}
        />
      </div>
    );
  } catch {
    content = <DbUnavailable />;
  }

  return content;
}
