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
import { CuteBananaMascot } from "@/components/CuteBananaMascot";
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
        <div className="rounded-3xl border border-pink-200/90 bg-white/90 p-8 sm:p-10 shadow-sm shadow-pink-100/50 text-center max-w-md mx-auto my-10 space-y-4">
          <div className="mx-auto flex h-24 w-24 items-center justify-center">
            <CuteBananaMascot variant="welcome" size={96} />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-[#2D1B2D]">
              {hasClosedBatches ? "Tidak Ada Batch Produksi Aktif" : "Belum Ada Batch Produksi"}
            </h2>
            <p className="mt-1.5 text-xs text-[#7A6273] leading-relaxed">
              {hasClosedBatches
                ? "Semua batch sebelumnya sudah ditutup rapi. Buka batch baru untuk mulai mencatat penjualan dan belanja bahan asinan hari ini ✨"
                : "Mulai pembukuan cantik asinan dengan membuka batch produksi perdana bersama Nana ya 💖"}
            </p>
          </div>
          <div className="pt-2 flex justify-center gap-2.5">
            <Link
              href="/batch"
              className="inline-flex items-center rounded-full bg-gradient-to-r from-pink-500 to-rose-500 px-5 py-2.5 text-xs font-black text-white shadow-sm shadow-pink-200 hover:from-pink-600 hover:to-rose-600 transition-all active:scale-95 cursor-pointer"
            >
              ✨ + Buka Batch Baru
            </Link>
            {hasClosedBatches && (
              <Link
                href={`/batch/${allBatches[0].id}`}
                className="inline-flex items-center rounded-full border border-pink-200 bg-white px-4 py-2.5 text-xs font-bold text-[#7A6273] hover:bg-pink-50 transition-colors"
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
        {/* Page Title & Context Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-pink-200/80 bg-white/90 p-4 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-100/90 to-pink-100/90 p-1 shadow-2xs">
              <CuteBananaMascot variant="advisor" size={42} />
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tight text-[#2D1B2D] flex items-center gap-2">
                <span>Financial Command Center</span>
                <span className="rounded-full bg-pink-100 px-2.5 py-0.5 text-[10px] font-extrabold text-pink-700">
                  Live
                </span>
              </h1>
              <p className="text-xs text-[#7A6273]">
                Monitoring omset, laba, piutang, dan rekomendasi cerdas asinan
              </p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-pink-100/70 px-3 py-1 text-xs font-bold text-pink-800 border border-pink-200/50">
            <span>📅 {active.date}</span>
            <span>·</span>
            <span>Modal {formatRp(active.initialCapital)}</span>
          </span>
        </div>

        {/* Zona 1: Cute KPI Summary Cards */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard
            label="Omset Batch"
            value={formatRp(f.omzet)}
            sub={`${paidCount} pesanan lunas`}
            variant="pink"
            icon="💖"
          />
          <StatCard
            label="Piutang (Tempo)"
            value={formatRp(f.totalReceivable)}
            sub={`${unpaidCount} belum bayar`}
            variant="butter"
            icon="🍯"
          />
          <StatCard
            label="Porsi / Cup Terjual"
            value={`${totalCups} Cup`}
            sub={`dari ${orders.length} transaksi`}
            variant="lavender"
            icon="🍧"
          />
          <StatCard
            label="Laba Bersih"
            value={formatRp(f.profit)}
            sub={`Margin ${formatPct(f.marginOnRevenuePct)}`}
            variant="mint"
            icon="🍀"
          />
        </div>

        {/* Zona 2 & Zona 3: Interactive Command Center + AI Advisor */}
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
