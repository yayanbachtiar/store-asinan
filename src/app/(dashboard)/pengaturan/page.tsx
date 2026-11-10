import { MemberForm, PatchButton, ProductForm, ProductPriceEdit } from "@/components/forms";
import { DbUnavailable, SectionTitle } from "@/components/ui";
import { listMembers, listProducts } from "@/lib/data";
import { formatRp } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function PengaturanPage() {
  let memberList: Awaited<ReturnType<typeof listMembers>> | null = null;
  let productList: Awaited<ReturnType<typeof listProducts>> | null = null;
  try {
    memberList = await listMembers();
    productList = await listProducts();
  } catch {
    memberList = null;
  }
  if (!memberList || !productList) return <DbUnavailable />;

  return (
    <>
      <h1 className="text-xl font-bold">Pengaturan</h1>

      <SectionTitle>Anggota Tim (maks. 5 orang)</SectionTitle>
      <div className="space-y-3">
        <MemberForm />
        <div className="rounded-2xl border border-amber-200 bg-white p-4 shadow-sm">
          {memberList.length === 0 && (
            <p className="text-sm text-stone-500">
              Belum ada anggota. Tambahkan anggota pertama lewat formulir di atas — email yang
              terdaftar di sinilah yang boleh login dengan Google.
            </p>
          )}
          {memberList.map((m) => (
            <div key={m.id} className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-100 py-2.5 text-sm last:border-0">
              <span>
                <b>{m.name}</b> — {m.email}
                <span className="block text-xs text-stone-500">
                  {m.role === "bendahara" ? "Bendahara" : "Anggota"}
                  {m.telegramId ? ` · Telegram ${m.telegramId}` : ""} ·{" "}
                  {m.isActive ? "Aktif" : "Nonaktif"}
                </span>
              </span>
              <span className="flex items-center gap-3">
                <PatchButton
                  path={`/api/members/${m.id}`}
                  body={{ role: m.role === "bendahara" ? "anggota" : "bendahara" }}
                  label={m.role === "bendahara" ? "Jadikan anggota" : "Jadikan bendahara"}
                />
                <PatchButton
                  path={`/api/members/${m.id}`}
                  body={{ isActive: !m.isActive }}
                  label={m.isActive ? "Nonaktifkan" : "Aktifkan"}
                />
              </span>
            </div>
          ))}
        </div>
      </div>

      <SectionTitle>Produk &amp; Harga</SectionTitle>
      <div className="space-y-3">
        <ProductForm />
        <div className="rounded-2xl border border-amber-200 bg-white p-4 shadow-sm">
          {productList.length === 0 && (
            <p className="text-sm text-stone-500">
              Belum ada produk. Jalankan <code>pnpm seed:products</code> untuk produk awal
              (Cup Kecil &amp; Cup Besar) atau tambahkan manual.
            </p>
          )}
          {productList.map((p) => (
            <div key={p.id} className="flex flex-wrap items-end justify-between gap-2 border-b border-stone-100 py-2.5 text-sm last:border-0">
              <span>
                <b>{p.name}</b>
                <span className="block text-xs text-stone-500">
                  {formatRp(p.price)} · {p.isActive ? "Aktif" : "Nonaktif"} — harga lama di order
                  tidak berubah (snapshot)
                </span>
              </span>
              <span className="flex items-end gap-3">
                <ProductPriceEdit id={p.id} initialPrice={p.price} />
                <PatchButton
                  path={`/api/products/${p.id}`}
                  body={{ isActive: !p.isActive }}
                  label={p.isActive ? "Nonaktifkan" : "Aktifkan"}
                />
              </span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
