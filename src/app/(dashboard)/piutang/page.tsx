import { DbUnavailable, StatCard } from "@/components/ui";
import { listUnpaidOrders } from "@/lib/data";
import { groupReceivables } from "@/lib/finance";
import { formatRp } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function PiutangPage() {
  let unpaid: Awaited<ReturnType<typeof listUnpaidOrders>> | null = null;
  try {
    unpaid = await listUnpaidOrders();
  } catch {
    unpaid = null;
  }
  if (!unpaid) return <DbUnavailable />;

  const groups = groupReceivables(unpaid);
  const total = groups.reduce((s, g) => s + g.total, 0);

  return (
    <>
      <h1 className="mb-4 text-xl font-bold">Piutang — Belum Bayar</h1>
      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Total piutang" value={formatRp(total)} />
        <StatCard label="Jumlah pelanggan menunggak" value={String(groups.length)} />
      </div>
      <div className="mt-5 space-y-3">
        {groups.length === 0 && (
          <p className="rounded-2xl bg-white p-4 text-sm shadow-sm">🎉 Tidak ada piutang — semua sudah bayar.</p>
        )}
        {groups.map((g) => (
          <div key={g.customerName} className="rounded-2xl border border-amber-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <b>{g.customerName}</b>
              <b className="text-red-700">{formatRp(g.total)}</b>
            </div>
            {g.orders.map((o) => (
              <p key={o.id} className="mt-1 text-xs text-stone-500">
                Order #{o.id} · batch {o.batchDate} · {formatRp(o.total)}
              </p>
            ))}
          </div>
        ))}
      </div>
    </>
  );
}
