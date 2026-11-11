import { notFound } from "next/navigation";
import Link from "next/link";
import {
  AdvanceForm,
  AllocationForm,
  DeleteButton,
  ExpenseForm,
  OrderForm,
  PatchButton,
  PaymentForm,
} from "@/components/forms";
import { DbUnavailable, SectionTitle, StatCard } from "@/components/ui";
import { getBatchDetail, listCustomers, listMembers, listProducts } from "@/lib/data";
import { validateAllocations } from "@/lib/finance";
import { formatPct, formatRp } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function BatchDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const id = (await params).id;

  let detail: Awaited<ReturnType<typeof getBatchDetail>> = null;
  let memberList: Awaited<ReturnType<typeof listMembers>> = [];
  let customerList: Awaited<ReturnType<typeof listCustomers>> = [];
  let productList: Awaited<ReturnType<typeof listProducts>> = [];
  try {
    detail = await getBatchDetail(id);
    if (detail) {
      memberList = await listMembers();
      customerList = await listCustomers();
      productList = await listProducts();
    }
  } catch {
    return <DbUnavailable />;
  }
  if (!detail) notFound();

  const { batch, finance: f } = detail;
  const allocationCheck = validateAllocations(f.profit, detail.allocations);
  const nonTreasurerMembers = memberList.filter((m) => m.id !== detail.treasurer?.id);

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-pink-200/80 bg-white/80 p-5 shadow-xs backdrop-blur-xs">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl font-extrabold tracking-tight text-[#2D1B2D]">
              {batch.title ?? `Batch ${batch.date}`}
            </h1>
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${
                batch.status === "aktif"
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200/80"
                  : "bg-stone-100 text-stone-600 border border-stone-200/70"
              }`}
            >
              {batch.status === "aktif" && (
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              )}
              {batch.status === "aktif" ? "Aktif" : "Ditutup"}
            </span>
          </div>
          <p className="mt-1 text-xs text-[#7A6273]">
            📅 {batch.date} · Modal awal <b className="text-[#2D1B2D]">{formatRp(batch.initialCapital)}</b> · Bendahara:{" "}
            <span className="font-bold text-pink-700">{detail.treasurer?.name ?? "Belum ada"}</span>
          </p>
        </div>

        <div>
          {batch.status === "aktif" ? (
            <PatchButton
              path={`/api/batches/${batch.id}`}
              body={{ status: "ditutup" }}
              label="🔒 Tutup Batch"
              className="rounded-full bg-stone-800 hover:bg-stone-900 px-4 py-2 text-xs font-bold text-white shadow-xs transition-all cursor-pointer"
            />
          ) : (
            <PatchButton
              path={`/api/batches/${batch.id}`}
              body={{ status: "aktif" }}
              label="🔓 Buka Lagi"
              className="rounded-full bg-pink-100 hover:bg-pink-200 text-pink-800 border border-pink-200 px-4 py-2 text-xs font-bold transition-all cursor-pointer"
            />
          )}
        </div>
      </div>

      {/* Ringkasan & ROI */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Omzet" value={formatRp(f.omzet)} icon="💰" variant="pink" />
        <StatCard label="Biaya Produksi" value={formatRp(f.totalExpenses)} icon="🧾" variant="butter" />
        <StatCard label="Laba Bersih" value={formatRp(f.profit)} icon="✨" variant="lavender" />
        <StatCard
          label="ROI atas Biaya"
          value={formatPct(f.roiOnCostPct)}
          icon="📈"
          variant="mint"
          sub={`Margin ${formatPct(f.marginOnRevenuePct)}`}
        />
      </div>

      {/* Rekonsiliasi Uang */}
      <div>
        <SectionTitle>Rekonsiliasi Uang</SectionTitle>
        <div className="rounded-3xl border border-pink-200/80 bg-white p-5 shadow-xs">
          <p className="text-xs text-[#7A6273]">
            Omzet <b className="text-[#2D1B2D]">{formatRp(f.omzet)}</b> = Kas Bendahara{" "}
            <b>{formatRp(f.treasurerCash)}</b> + Belum Disetor <b>{formatRp(f.totalUnsettled)}</b> + Piutang{" "}
            <b>{formatRp(f.totalReceivable)}</b>
          </p>
          <div className="mt-2.5">
            {f.reconciliationDiff === 0 ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-bold text-emerald-700">
                <span>✅</span>
                <span>Klop — tidak ada selisih uang.</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 border border-rose-200 px-3 py-1 text-xs font-bold text-rose-700">
                <span>⚠️</span>
                <span>Selisih {formatRp(f.reconciliationDiff)} — periksa pembayaran atau setoran.</span>
              </span>
            )}
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-pink-100 text-left font-bold text-[#7A6273]">
                  <th className="pb-2">Anggota</th>
                  <th className="pb-2 text-right">Terima Pembayaran</th>
                  <th className="pb-2 text-right">Setor Diterima</th>
                  <th className="pb-2 text-right">Masih di Tangan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-pink-50">
                {f.memberPositions.map((pos) => (
                  <tr key={pos.memberId} className="hover:bg-pink-50/40 transition-colors">
                    <td className="py-2.5 font-bold text-[#2D1B2D]">
                      {memberList.find((m) => m.id === pos.memberId)?.name ?? `#${pos.memberId}`}
                      {pos.memberId === detail.treasurer?.id && (
                        <span className="ml-1.5 text-[10px] font-semibold text-pink-600 bg-pink-100/70 px-2 py-0.5 rounded-full">
                          Bendahara
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 text-right text-[#7A6273]">{formatRp(pos.received)}</td>
                    <td className="py-2.5 text-right text-emerald-700 font-medium">{formatRp(pos.settledAccepted)}</td>
                    <td className="py-2.5 text-right font-extrabold text-[#2D1B2D]">{formatRp(pos.outstanding)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Pengeluaran */}
      <div>
        <SectionTitle>Pengeluaran — total {formatRp(f.totalExpenses)}</SectionTitle>
        <div className="space-y-4">
          <ExpenseForm batchId={batch.id} members={memberList} />
          <div className="rounded-3xl border border-pink-200/80 bg-white p-5 shadow-xs">
            {detail.expenses.length === 0 ? (
              <p className="text-xs text-[#7A6273] text-center py-4">Belum ada pengeluaran belanja bahan.</p>
            ) : (
              <div className="divide-y divide-pink-50">
                {detail.expenses.map((e) => (
                  <div key={e.id} className="flex items-center justify-between py-2.5 text-xs first:pt-0 last:pb-0">
                    <div>
                      <span className="font-bold text-[#2D1B2D] text-sm">{e.description}</span>
                      <span className="block text-[11px] text-[#7A6273]">
                        Dibayar oleh <b className="text-pink-700">{e.paidByName}</b>
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-extrabold text-[#2D1B2D]">{formatRp(e.amount)}</span>
                      <DeleteButton path={`/api/expenses/${e.id}`} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Order */}
      <div>
        <SectionTitle>Order — omzet {formatRp(f.omzet)}</SectionTitle>
        <div className="space-y-4">
          <OrderForm batchId={batch.id} customers={customerList} products={productList} />
          <div className="rounded-3xl border border-pink-200/80 bg-white p-5 shadow-xs">
            {detail.orders.length === 0 ? (
              <p className="text-xs text-[#7A6273] text-center py-4">Belum ada pesanan masuk.</p>
            ) : (
              <div className="divide-y divide-pink-50">
                {detail.orders.map((o) => (
                  <div key={o.id} className="py-3 text-xs first:pt-0 last:pb-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="font-extrabold text-sm text-[#2D1B2D]">{o.customerName}</span>
                        <span className="block text-[11px] text-[#7A6273] mt-0.5">
                          {o.items.map((i) => `${i.qty}× ${i.productNameSnapshot}`).join(", ")} · Sumber:{" "}
                          <span className="font-semibold text-pink-700">
                            {o.source === "wa" ? "WhatsApp" : o.source === "puskesmas" ? "Puskesmas" : "Langsung"}
                          </span>
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-extrabold text-sm text-[#2D1B2D]">{formatRp(o.total)}</span>
                        <DeleteButton path={`/api/orders/${o.id}`} />
                      </div>
                    </div>

                    {o.paymentStatus === "sudah" && o.payment ? (
                      <div className="mt-2 flex items-center justify-between rounded-2xl bg-emerald-50/70 border border-emerald-200/60 px-3 py-1.5 text-[11px] text-emerald-800">
                        <span>
                          ✅ Sudah lunas {formatRp(o.payment.amount)} ({o.payment.method === "cash" ? "tunai" : "transfer"}), diterima oleh{" "}
                          <b>{memberList.find((m) => m.id === o.payment!.receivedBy)?.name ?? "?"}</b>
                        </span>
                        <DeleteButton path={`/api/payments/${o.payment.id}`} label="Batalkan" />
                      </div>
                    ) : (
                      <div className="mt-2 space-y-2">
                        <div className="inline-flex items-center gap-1 rounded-full bg-rose-50 border border-rose-200 px-2.5 py-0.5 text-[10px] font-bold text-rose-700">
                          <span>⏳</span>
                          <span>Belum Bayar</span>
                        </div>
                        <PaymentForm orderId={o.id} defaultAmount={o.total} members={memberList} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Talangan Modal */}
      <div>
        <SectionTitle>Talangan Modal — belum diganti {formatRp(f.outstandingAdvances)}</SectionTitle>
        <div className="space-y-4">
          <AdvanceForm batchId={batch.id} members={memberList} />
          <div className="rounded-3xl border border-pink-200/80 bg-white p-5 shadow-xs">
            {detail.advances.length === 0 ? (
              <p className="text-xs text-[#7A6273] text-center py-4">Tidak ada talangan modal.</p>
            ) : (
              <div className="divide-y divide-pink-50">
                {detail.advances.map((a) => (
                  <div key={a.id} className="flex items-center justify-between py-2.5 text-xs first:pt-0 last:pb-0">
                    <div>
                      <span className="font-bold text-[#2D1B2D] text-sm">{a.memberName}</span>
                      <span className="block text-[11px] text-[#7A6273] mt-0.5">
                        {formatRp(a.amount)} ·{" "}
                        <span
                          className={`font-semibold ${
                            a.status === "diganti" ? "text-emerald-700" : "text-rose-700"
                          }`}
                        >
                          {a.status === "diganti" ? "Sudah diganti" : "Belum diganti"}
                        </span>
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <PatchButton
                        path={`/api/advances/${a.id}`}
                        body={{ status: a.status === "diganti" ? "belum_diganti" : "diganti" }}
                        label={a.status === "diganti" ? "Tandai belum diganti" : "Tandai sudah diganti"}
                      />
                      <DeleteButton path={`/api/advances/${a.id}`} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Alokasi Laba */}
      <div>
        <SectionTitle>Alokasi Laba — laba bersih {formatRp(f.profit)}</SectionTitle>
        <div className="space-y-4">
          <div className="rounded-3xl border border-pink-200/80 bg-white p-5 shadow-xs text-xs space-y-3">
            <p className="text-[#7A6273]">
              Teralokasi: <b className="text-[#2D1B2D]">{formatRp(f.allocationTotal)}</b> (Ditahan:{" "}
              <b>{formatRp(f.allocationByKind.ditahan)}</b> · Diputar: <b>{formatRp(f.allocationByKind.diputar)}</b>{" "}
              · Dibagi: <b>{formatRp(f.allocationByKind.dibagi)}</b>)
            </p>
            <div>
              {allocationCheck.ok ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-bold text-emerald-700">
                  <span>✅</span>
                  <span>Total alokasi pas dengan laba.</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-200 px-3 py-1 text-xs font-bold text-amber-800">
                  <span>⚠️</span>
                  <span>Selisih {formatRp(allocationCheck.diff)} dari laba (harus pas persis = laba).</span>
                </span>
              )}
            </div>

            {detail.allocations.length > 0 && (
              <div className="divide-y divide-pink-50 border-t border-pink-100 pt-2">
                {detail.allocations.map((a) => (
                  <div key={a.id} className="flex items-center justify-between py-2 first:pt-0 last:pb-0">
                    <div>
                      <span className="font-bold text-[#2D1B2D]">
                        {a.kind === "ditahan"
                          ? "Ditahan di kas"
                          : a.kind === "diputar"
                          ? "Diputar jadi modal"
                          : `Dibagi ke ${a.memberName ?? "?"}`}
                      </span>
                      {a.note && <span className="block text-[11px] text-[#7A6273]">{a.note}</span>}
                    </div>
                    <div className="flex items-center gap-3">
                      <b className="text-[#2D1B2D]">{formatRp(a.amount)}</b>
                      <DeleteButton path={`/api/allocations/${a.id}`} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <AllocationForm batchId={batch.id} members={memberList} />
        </div>
      </div>

      <div className="rounded-3xl border border-pink-100 bg-pink-50/50 p-4 text-xs text-[#7A6273]">
        💡 Setoran anggota ke bendahara dicatat &amp; dikonfirmasi di menu{" "}
        <Link className="font-bold text-pink-700 underline" href="/kas">
          Kas &amp; Setoran
        </Link>
        . Anggota non-bendahara: {nonTreasurerMembers.map((m) => m.name).join(", ") || "—"}.
      </div>
    </div>
  );
}
