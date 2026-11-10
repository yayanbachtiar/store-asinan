import { notFound } from "next/navigation";
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
  const id = (await params).id; // ID dokumen Firestore (string)

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
    <>
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-xl font-bold">
          {batch.title ?? `Batch ${batch.date}`}
        </h1>
        <span
          className={`rounded-full px-2 py-1 text-xs font-semibold ${
            batch.status === "aktif" ? "bg-emerald-100 text-emerald-700" : "bg-stone-200 text-stone-600"
          }`}
        >
          {batch.status === "aktif" ? "Aktif" : "Ditutup"}
        </span>
        <span className="text-sm text-stone-500">
          {batch.date} · Modal awal {formatRp(batch.initialCapital)} · Bendahara:{" "}
          {detail.treasurer?.name ?? "belum ada"}
        </span>
        <span className="ml-auto">
          {batch.status === "aktif" ? (
            <PatchButton
              path={`/api/batches/${batch.id}`}
              body={{ status: "ditutup" }}
              label="Tutup batch"
              className="rounded-lg bg-stone-800 px-3 py-1.5 text-xs font-semibold text-white"
            />
          ) : (
            <PatchButton
              path={`/api/batches/${batch.id}`}
              body={{ status: "aktif" }}
              label="Buka lagi"
              className="text-xs font-medium text-amber-700 underline"
            />
          )}
        </span>
      </div>

      {/* Ringkasan & ROI */}
      <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Omzet" value={formatRp(f.omzet)} />
        <StatCard label="Biaya produksi" value={formatRp(f.totalExpenses)} />
        <StatCard label="Laba" value={formatRp(f.profit)} />
        <StatCard
          label="ROI atas biaya (per batch)"
          value={formatPct(f.roiOnCostPct)}
          sub={`Margin omzet ${formatPct(f.marginOnRevenuePct)}`}
        />
      </div>

      {/* Rekonsiliasi */}
      <SectionTitle>Rekonsiliasi Uang</SectionTitle>
      <div className="rounded-2xl border border-amber-200 bg-white p-4 shadow-sm">
        <p className="text-sm">
          Omzet {formatRp(f.omzet)} = kas bendahara {formatRp(f.treasurerCash)} + belum disetor{" "}
          {formatRp(f.totalUnsettled)} + piutang {formatRp(f.totalReceivable)}
        </p>
        <p className={`mt-1 text-sm font-semibold ${f.reconciliationDiff === 0 ? "text-emerald-700" : "text-red-700"}`}>
          {f.reconciliationDiff === 0
            ? "✅ Klop — tidak ada selisih."
            : `⚠️ Selisih ${formatRp(f.reconciliationDiff)} — periksa pembayaran/setoran.`}
        </p>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-stone-500">
                <th className="py-1">Anggota</th>
                <th className="py-1 text-right">Terima pembayaran</th>
                <th className="py-1 text-right">Sudah setor (diterima)</th>
                <th className="py-1 text-right">Masih di tangan</th>
              </tr>
            </thead>
            <tbody>
              {f.memberPositions.map((pos) => (
                <tr key={pos.memberId} className="border-t border-stone-100">
                  <td className="py-1">
                    {memberList.find((m) => m.id === pos.memberId)?.name ?? `#${pos.memberId}`}
                    {pos.memberId === detail.treasurer?.id ? " (bendahara)" : ""}
                  </td>
                  <td className="py-1 text-right">{formatRp(pos.received)}</td>
                  <td className="py-1 text-right">{formatRp(pos.settledAccepted)}</td>
                  <td className="py-1 text-right font-medium">{formatRp(pos.outstanding)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pengeluaran */}
      <SectionTitle>Pengeluaran — total {formatRp(f.totalExpenses)}</SectionTitle>
      <div className="space-y-3">
        <ExpenseForm batchId={batch.id} members={memberList} />
        <div className="rounded-2xl border border-amber-200 bg-white p-4 shadow-sm">
          {detail.expenses.length === 0 && <p className="text-sm text-stone-500">Belum ada pengeluaran.</p>}
          {detail.expenses.map((e) => (
            <div key={e.id} className="flex items-center justify-between border-b border-stone-100 py-2 text-sm last:border-0">
              <span>
                {e.description}
                <span className="block text-xs text-stone-500">dibayar {e.paidByName}</span>
              </span>
              <span className="flex items-center gap-3">
                <b>{formatRp(e.amount)}</b>
                <DeleteButton path={`/api/expenses/${e.id}`} />
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Order */}
      <SectionTitle>Order — omzet {formatRp(f.omzet)}</SectionTitle>
      <div className="space-y-3">
        <OrderForm batchId={batch.id} customers={customerList} products={productList} />
        <div className="rounded-2xl border border-amber-200 bg-white p-4 shadow-sm">
          {detail.orders.length === 0 && <p className="text-sm text-stone-500">Belum ada order.</p>}
          {detail.orders.map((o) => (
            <div key={o.id} className="border-b border-stone-100 py-3 text-sm last:border-0">
              <div className="flex items-start justify-between gap-2">
                <span>
                  <b>{o.customerName}</b>
                  <span className="block text-xs text-stone-500">
                    {o.items.map((i) => `${i.qty}× ${i.productNameSnapshot}`).join(", ")} · sumber:{" "}
                    {o.source === "wa" ? "WhatsApp" : o.source === "puskesmas" ? "Puskesmas" : "Langsung"}
                  </span>
                </span>
                <span className="flex items-center gap-3">
                  <b>{formatRp(o.total)}</b>
                  <DeleteButton path={`/api/orders/${o.id}`} />
                </span>
              </div>
              {o.paymentStatus === "sudah" && o.payment ? (
                <p className="mt-1 text-xs text-emerald-700">
                  ✅ Sudah bayar {formatRp(o.payment.amount)} ({o.payment.method === "cash" ? "tunai" : "transfer"})
                  , diterima {memberList.find((m) => m.id === o.payment!.receivedBy)?.name ?? "?"}{" "}
                  <DeleteButton path={`/api/payments/${o.payment.id}`} label="Batalkan pembayaran" />
                </p>
              ) : (
                <>
                  <span className="mt-1 inline-block rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">
                    Belum bayar
                  </span>{" "}
                  <PaymentForm orderId={o.id} defaultAmount={o.total} members={memberList} />
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Talangan */}
      <SectionTitle>Talangan — belum diganti {formatRp(f.outstandingAdvances)}</SectionTitle>
      <div className="space-y-3">
        <AdvanceForm batchId={batch.id} members={memberList} />
        <div className="rounded-2xl border border-amber-200 bg-white p-4 shadow-sm">
          {detail.advances.length === 0 && <p className="text-sm text-stone-500">Tidak ada talangan.</p>}
          {detail.advances.map((a) => (
            <div key={a.id} className="flex items-center justify-between border-b border-stone-100 py-2 text-sm last:border-0">
              <span>
                {a.memberName} — {formatRp(a.amount)}
                <span className="block text-xs text-stone-500">
                  {a.status === "diganti" ? "Sudah diganti" : "Belum diganti"}
                </span>
              </span>
              <span className="flex items-center gap-3">
                <PatchButton
                  path={`/api/advances/${a.id}`}
                  body={{ status: a.status === "diganti" ? "belum_diganti" : "diganti" }}
                  label={a.status === "diganti" ? "Tandai belum diganti" : "Tandai sudah diganti"}
                />
                <DeleteButton path={`/api/advances/${a.id}`} />
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Alokasi laba */}
      <SectionTitle>Alokasi Laba — laba {formatRp(f.profit)}</SectionTitle>
      <div className="space-y-3">
        <div className="rounded-2xl border border-amber-200 bg-white p-4 shadow-sm text-sm">
          <p>
            Teralokasi: <b>{formatRp(f.allocationTotal)}</b> (ditahan {formatRp(f.allocationByKind.ditahan)} ·
            diputar {formatRp(f.allocationByKind.diputar)} · dibagi {formatRp(f.allocationByKind.dibagi)})
          </p>
          <p className={`mt-1 font-semibold ${allocationCheck.ok ? "text-emerald-700" : "text-amber-700"}`}>
            {allocationCheck.ok
              ? "✅ Total alokasi pas dengan laba."
              : `Belum pas: selisih ${formatRp(allocationCheck.diff)} dari laba (total alokasi harus persis = laba).`}
          </p>
          {detail.allocations.map((a) => (
            <div key={a.id} className="flex items-center justify-between border-b border-stone-100 py-2 last:border-0">
              <span>
                {a.kind === "ditahan" ? "Ditahan di kas" : a.kind === "diputar" ? "Diputar jadi modal" : `Dibagi ke ${a.memberName ?? "?"}`}
                {a.note ? <span className="block text-xs text-stone-500">{a.note}</span> : null}
              </span>
              <span className="flex items-center gap-3">
                <b>{formatRp(a.amount)}</b>
                <DeleteButton path={`/api/allocations/${a.id}`} />
              </span>
            </div>
          ))}
        </div>
        <AllocationForm batchId={batch.id} members={memberList} />
      </div>

      <p className="mt-8 text-xs text-stone-500">
        Setoran anggota ke bendahara dicatat &amp; dikonfirmasi di halaman{" "}
        <a className="font-semibold text-amber-700 underline" href="/kas">
          Kas &amp; Setoran
        </a>{" "}
        (posisi kas dihitung global, lintas batch). Anggota non-bendahara:{" "}
        {nonTreasurerMembers.map((m) => m.name).join(", ") || "—"}.
      </p>
    </>
  );
}
