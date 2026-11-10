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
    <>
      <h1 className="mb-4 text-xl font-bold">Kas &amp; Setoran</h1>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <StatCard
          label={`Kas bendahara${data.treasurer ? ` (${data.treasurer.name})` : ""}`}
          value={formatRp(data.treasurerCash)}
        />
        <StatCard label="Masih di tangan anggota (belum setor)" value={formatRp(data.totalUnsettled)} />
        <StatCard label="Talangan belum diganti (semua batch)" value={formatRp(data.outstandingAdvances)} />
      </div>

      <SectionTitle>Posisi Uang per Anggota</SectionTitle>
      <div className="overflow-x-auto rounded-2xl border border-amber-200 bg-white p-4 shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-stone-500">
              <th className="py-1">Anggota</th>
              <th className="py-1 text-right">Terima pembayaran</th>
              <th className="py-1 text-right">Setor diterima</th>
              <th className="py-1 text-right">Setor menunggu</th>
              <th className="py-1 text-right">Masih di tangan</th>
            </tr>
          </thead>
          <tbody>
            {data.members.map(({ member, position }) => (
              <tr key={member.id} className="border-t border-stone-100">
                <td className="py-1.5">
                  {member.name}
                  {member.role === "bendahara" ? " (bendahara)" : ""}
                </td>
                <td className="py-1.5 text-right">{formatRp(position.received)}</td>
                <td className="py-1.5 text-right">{formatRp(position.settledAccepted)}</td>
                <td className="py-1.5 text-right">{formatRp(position.settledPending)}</td>
                <td className="py-1.5 text-right font-semibold">{formatRp(position.outstanding)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <SectionTitle>Setoran</SectionTitle>
      <div className="space-y-3">
        <SettlementForm members={nonTreasurer.map((m) => m.member)} />
        <div className="rounded-2xl border border-amber-200 bg-white p-4 shadow-sm">
          {data.settlements.length === 0 && <p className="text-sm text-stone-500">Belum ada setoran.</p>}
          {data.settlements.map((s) => (
            <div key={s.id} className="flex items-center justify-between border-b border-stone-100 py-2 text-sm last:border-0">
              <span>
                {s.memberName} → bendahara: <b>{formatRp(s.amount)}</b>
                <span className="block text-xs text-stone-500">
                  {s.status === "diterima" ? "✅ Sudah diterima" : "⏳ Menunggu konfirmasi bendahara"}
                </span>
              </span>
              <span className="flex items-center gap-3">
                {s.status === "menunggu" ? (
                  <PatchButton path={`/api/settlements/${s.id}`} body={{ status: "diterima" }} label="Konfirmasi diterima" />
                ) : (
                  <PatchButton path={`/api/settlements/${s.id}`} body={{ status: "menunggu" }} label="Batalkan konfirmasi" />
                )}
                <DeleteButton path={`/api/settlements/${s.id}`} />
              </span>
            </div>
          ))}
        </div>
      </div>

      <SectionTitle>Talangan (semua batch)</SectionTitle>
      <div className="rounded-2xl border border-amber-200 bg-white p-4 shadow-sm">
        {data.advances.length === 0 && <p className="text-sm text-stone-500">Tidak ada talangan.</p>}
        {data.advances.map((a) => (
          <div key={a.id} className="flex items-center justify-between border-b border-stone-100 py-2 text-sm last:border-0">
            <span>
              {a.memberName} — batch {a.batchDate} — {formatRp(a.amount)}
            </span>
            <span className="flex items-center gap-3">
              <span className={a.status === "diganti" ? "text-emerald-700" : "text-red-700"}>
                {a.status === "diganti" ? "Sudah diganti" : "Belum diganti"}
              </span>
              <PatchButton
                path={`/api/advances/${a.id}`}
                body={{ status: a.status === "diganti" ? "belum_diganti" : "diganti" }}
                label="Ubah status"
              />
              </span>
            </div>
        ))}
      </div>
    </>
  );
}
