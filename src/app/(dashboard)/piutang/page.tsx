import { DbUnavailable, StatCard, CuteEmptyState } from "@/components/ui";
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
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-extrabold tracking-tight text-[#2D1B2D] flex items-center gap-2">
          <span>📒</span>
          <span>Piutang — Belum Bayar</span>
        </h1>
        <p className="text-xs text-[#7A6273] mt-0.5">
          Pantau pesanan pelanggan yang belum diselesaikan pembayarannya di setiap batch.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <StatCard
          label="Total Piutang Tertunggak"
          value={formatRp(total)}
          icon="💸"
          variant="pink"
        />
        <StatCard
          label="Jumlah Pelanggan Menunggak"
          value={`${groups.length} orang`}
          icon="👥"
          variant="butter"
        />
      </div>

      <div className="space-y-3">
        <h2 className="text-sm font-bold text-[#7A6273] uppercase tracking-wider">
          Rincian Piutang per Pelanggan
        </h2>

        {groups.length === 0 ? (
          <CuteEmptyState
            title="🎉 Hebat! Semua Pesanan Sudah Lunas"
            message="Tidak ada piutang tertunggak saat ini. Semua pesanan asinan sudah dibayar lunas oleh pelanggan."
          />
        ) : (
          <div className="grid gap-3">
            {groups.map((g) => (
              <div
                key={g.customerName}
                className="rounded-3xl border border-pink-200/80 bg-white p-5 shadow-xs transition-all hover:border-pink-300"
              >
                <div className="flex items-center justify-between border-b border-pink-100 pb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-8 w-8 items-center justify-center rounded-2xl bg-rose-100 text-xs font-bold text-rose-700">
                      👤
                    </span>
                    <span className="font-extrabold text-sm text-[#2D1B2D]">{g.customerName}</span>
                  </div>
                  <span className="rounded-full bg-rose-50 border border-rose-200 px-3 py-1 text-xs font-extrabold text-rose-700">
                    {formatRp(g.total)}
                  </span>
                </div>

                <div className="mt-3 space-y-1.5">
                  {g.orders.map((o) => (
                    <div key={o.id} className="flex items-center justify-between text-xs text-[#7A6273]">
                      <span>
                        🏷️ Order #{o.id.slice(0, 6)} · Batch {o.batchDate}
                      </span>
                      <span className="font-semibold text-[#2D1B2D]">{formatRp(o.total)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
