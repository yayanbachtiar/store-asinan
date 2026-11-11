import { CustomerEdit, CustomerForm, DeleteButton } from "@/components/forms";
import { DbUnavailable, CuteEmptyState } from "@/components/ui";
import { listCustomers } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function PelangganPage() {
  let rows: Awaited<ReturnType<typeof listCustomers>> | null = null;
  try {
    rows = await listCustomers();
  } catch {
    rows = null;
  }
  if (!rows) return <DbUnavailable />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-extrabold tracking-tight text-[#2D1B2D] flex items-center gap-2">
          <span>🌸</span>
          <span>Pelanggan Setia</span>
        </h1>
        <p className="text-xs text-[#7A6273] mt-0.5">
          Simpan daftar pelanggan, grup pesanan (kantor/puskesmas), dan riwayat nama pemesan.
        </p>
      </div>

      <CustomerForm />

      <div className="space-y-3">
        <h2 className="text-sm font-bold text-[#7A6273] uppercase tracking-wider">
          Daftar Pelanggan ({rows.length})
        </h2>

        {rows.length === 0 ? (
          <CuteEmptyState
            title="Belum Ada Pelanggan"
            message="Tambahkan pelanggan pertamamu lewat form di atas untuk memudahkan pencatatan order."
          />
        ) : (
          <div className="rounded-3xl border border-pink-200/80 bg-white p-5 shadow-xs divide-y divide-pink-50">
            {rows.map((c) => {
              const initial = c.name ? c.name.slice(0, 1).toUpperCase() : "P";
              return (
                <div key={c.id} className="py-3 text-xs first:pt-0 last:pb-0">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-pink-100 to-rose-100 text-xs font-bold text-pink-700 shadow-2xs border border-pink-200/60">
                        {initial}
                      </div>
                      <div>
                        <span className="font-extrabold text-sm text-[#2D1B2D]">{c.name}</span>
                        {c.note ? (
                          <span className="block text-[11px] text-[#7A6273] mt-0.5">
                            📍 {c.note}
                          </span>
                        ) : (
                          <span className="block text-[11px] text-[#A892A2] mt-0.5 italic">
                            Tanpa catatan
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <CustomerEdit id={c.id} initialName={c.name} initialNote={c.note} />
                      <DeleteButton path={`/api/customers/${c.id}`} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
