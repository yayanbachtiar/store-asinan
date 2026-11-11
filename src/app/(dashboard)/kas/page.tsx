import { DeleteButton, PatchButton, SettlementForm } from "@/components/forms";
import { DbUnavailable, SectionTitle, StatCard } from "@/components/ui";
import { getCashPositions } from "@/lib/data";
import { formatRp } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function KasPage() {
  let data: Awaited<ReturnType<typeof getCashPositions>> | null = null;
  try {
    data = await getCashPositions();
  } catch {
    data = null;
  }
  if (!data) return <DbUnavailable />;

  const nonTreasurer = data.members.filter((m) => m.member.id !== data.treasurer?.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-extrabold tracking-tight text-[#2D1B2D] flex items-center gap-2">
          <span>🏦</span>
          <span>Kas &amp; Setoran</span>
        </h1>
        <p className="text-xs text-[#7A6273] mt-0.5">
          Pantau uang tunai di bendahara, uang di tangan anggota, serta setoran yang menunggu konfirmasi.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <StatCard
          label={`Kas Bendahara${data.treasurer ? ` (${data.treasurer.name})` : ""}`}
          value={formatRp(data.treasurerCash)}
          icon="💰"
          variant="mint"
        />
        <StatCard
          label="Di Tangan Anggota (Belum Setor)"
          value={formatRp(data.totalUnsettled)}
          icon="🤝"
          variant="butter"
        />
        <StatCard
          label="Talangan Belum Diganti"
          value={formatRp(data.outstandingAdvances)}
          icon="⏳"
          variant="pink"
          sub="Semua batch"
        />
      </div>

      {/* Posisi Uang per Anggota */}
      <div>
        <SectionTitle>Posisi Uang per Anggota</SectionTitle>
        <div className="rounded-3xl border border-pink-200/80 bg-white p-5 shadow-xs overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-pink-100 text-left font-bold text-[#7A6273]">
                <th className="pb-2">Anggota</th>
                <th className="pb-2 text-right">Terima Pembayaran</th>
                <th className="pb-2 text-right">Setor Diterima</th>
                <th className="pb-2 text-right">Setor Menunggu</th>
                <th className="pb-2 text-right">Masih di Tangan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-pink-50">
              {data.members.map(({ member, position }) => (
                <tr key={member.id} className="hover:bg-pink-50/40 transition-colors">
                  <td className="py-2.5 font-bold text-[#2D1B2D]">
                    {member.name}
                    {member.role === "bendahara" && (
                      <span className="ml-1.5 text-[10px] font-semibold text-pink-600 bg-pink-100/70 px-2 py-0.5 rounded-full">
                        Bendahara
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 text-right text-[#7A6273]">{formatRp(position.received)}</td>
                  <td className="py-2.5 text-right text-emerald-700 font-medium">{formatRp(position.settledAccepted)}</td>
                  <td className="py-2.5 text-right text-amber-700 font-medium">{formatRp(position.settledPending)}</td>
                  <td className="py-2.5 text-right font-extrabold text-[#2D1B2D]">{formatRp(position.outstanding)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Setoran */}
      <div>
        <SectionTitle>Catat Setoran ke Bendahara</SectionTitle>
        <div className="space-y-4">
          <SettlementForm members={nonTreasurer.map((m) => m.member)} />
          <div className="rounded-3xl border border-pink-200/80 bg-white p-5 shadow-xs">
            {data.settlements.length === 0 ? (
              <p className="text-xs text-[#7A6273] text-center py-4">Belum ada riwayat setoran.</p>
            ) : (
              <div className="divide-y divide-pink-50">
                {data.settlements.map((s) => (
                  <div key={s.id} className="flex items-center justify-between py-2.5 text-xs first:pt-0 last:pb-0">
                    <div>
                      <span className="font-bold text-[#2D1B2D] text-sm">
                        {s.memberName} → Bendahara: <b className="text-pink-700">{formatRp(s.amount)}</b>
                      </span>
                      <span className="block text-[11px] text-[#7A6273] mt-0.5">
                        {s.status === "diterima" ? (
                          <span className="text-emerald-700 font-semibold">✅ Sudah diterima bendahara</span>
                        ) : (
                          <span className="text-amber-700 font-semibold">⏳ Menunggu konfirmasi bendahara</span>
                        )}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {s.status === "menunggu" ? (
                        <PatchButton
                          path={`/api/settlements/${s.id}`}
                          body={{ status: "diterima" }}
                          label="Konfirmasi Diterima"
                          className="rounded-full bg-emerald-600 hover:bg-emerald-700 px-3.5 py-1 text-xs font-bold text-white shadow-2xs transition-all cursor-pointer"
                        />
                      ) : (
                        <PatchButton
                          path={`/api/settlements/${s.id}`}
                          body={{ status: "menunggu" }}
                          label="Batalkan Konfirmasi"
                        />
                      )}
                      <DeleteButton path={`/api/settlements/${s.id}`} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Talangan Modal */}
      <div>
        <SectionTitle>Talangan Modal (Semua Batch)</SectionTitle>
        <div className="rounded-3xl border border-pink-200/80 bg-white p-5 shadow-xs">
          {data.advances.length === 0 ? (
            <p className="text-xs text-[#7A6273] text-center py-4">Tidak ada catatan talangan aktif.</p>
          ) : (
            <div className="divide-y divide-pink-50">
              {data.advances.map((a) => (
                <div key={a.id} className="flex items-center justify-between py-2.5 text-xs first:pt-0 last:pb-0">
                  <div>
                    <span className="font-bold text-[#2D1B2D]">
                      {a.memberName} — Batch {a.batchDate}
                    </span>
                    <span className="block text-[11px] text-[#7A6273] mt-0.5">
                      Jumlah: <b className="text-[#2D1B2D]">{formatRp(a.amount)}</b> ·{" "}
                      <span className={a.status === "diganti" ? "text-emerald-700 font-semibold" : "text-rose-700 font-semibold"}>
                        {a.status === "diganti" ? "Sudah diganti" : "Belum diganti"}
                      </span>
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <PatchButton
                      path={`/api/advances/${a.id}`}
                      body={{ status: a.status === "diganti" ? "belum_diganti" : "diganti" }}
                      label="Ubah Status"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
