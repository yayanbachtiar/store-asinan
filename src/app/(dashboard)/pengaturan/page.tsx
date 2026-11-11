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
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-extrabold tracking-tight text-[#2D1B2D] flex items-center gap-2">
          <span>⚙️</span>
          <span>Pengaturan Sistem</span>
        </h1>
        <p className="text-xs text-[#7A6273] mt-0.5">
          Kelola hak akses anggota tim, peran bendahara, dan katalog produk asinan beserta harga jualnya.
        </p>
      </div>

      {/* Anggota Tim */}
      <div>
        <SectionTitle>Anggota Tim (Maksimal 5 Orang)</SectionTitle>
        <div className="space-y-4">
          <MemberForm />
          <div className="rounded-3xl border border-pink-200/80 bg-white p-5 shadow-xs">
            {memberList.length === 0 ? (
              <p className="text-xs text-[#7A6273] text-center py-4">
                Belum ada anggota terdaftar. Tambahkan anggota pertama lewat formulir di atas agar bisa login via Google.
              </p>
            ) : (
              <div className="divide-y divide-pink-50">
                {memberList.map((m) => (
                  <div
                    key={m.id}
                    className="flex flex-wrap items-center justify-between gap-3 py-3 text-xs first:pt-0 last:pb-0"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-pink-100 text-xs font-bold text-pink-700">
                        {m.name.slice(0, 1).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-sm text-[#2D1B2D]">{m.name}</span>
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                              m.role === "bendahara"
                                ? "bg-pink-100 text-pink-800 border border-pink-200/70"
                                : "bg-purple-100 text-purple-800 border border-purple-200/70"
                            }`}
                          >
                            {m.role === "bendahara" ? "👑 Bendahara" : "Anggota"}
                          </span>
                          {!m.isActive && (
                            <span className="rounded-full bg-stone-100 px-2 py-0.5 text-[10px] font-semibold text-stone-500">
                              Nonaktif
                            </span>
                          )}
                        </div>
                        <span className="block text-[11px] text-[#7A6273] mt-0.5">
                          ✉️ {m.email} {m.telegramId ? `· 💬 @${m.telegramId}` : ""}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <PatchButton
                        path={`/api/members/${m.id}`}
                        body={{ role: m.role === "bendahara" ? "anggota" : "bendahara" }}
                        label={m.role === "bendahara" ? "Jadikan Anggota" : "Jadikan Bendahara"}
                      />
                      <PatchButton
                        path={`/api/members/${m.id}`}
                        body={{ isActive: !m.isActive }}
                        label={m.isActive ? "Nonaktifkan" : "Aktifkan"}
                        className={
                          m.isActive
                            ? "rounded-full bg-stone-100 border border-stone-200 px-3 py-1 text-xs font-semibold text-stone-600 hover:bg-stone-200 transition-all cursor-pointer"
                            : "rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-bold text-emerald-700 hover:bg-emerald-100 transition-all cursor-pointer"
                        }
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Produk & Harga */}
      <div>
        <SectionTitle>Katalog Produk &amp; Harga</SectionTitle>
        <div className="space-y-4">
          <ProductForm />
          <div className="rounded-3xl border border-pink-200/80 bg-white p-5 shadow-xs">
            {productList.length === 0 ? (
              <p className="text-xs text-[#7A6273] text-center py-4">
                Belum ada produk. Jalankan <code className="bg-pink-100 px-1 py-0.5 rounded text-pink-800">pnpm seed:products</code> untuk menambah produk bawaan.
              </p>
            ) : (
              <div className="divide-y divide-pink-50">
                {productList.map((p) => (
                  <div
                    key={p.id}
                    className="flex flex-wrap items-center justify-between gap-3 py-3 text-xs first:pt-0 last:pb-0"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-sm text-[#2D1B2D]">🥭 {p.name}</span>
                        {!p.isActive && (
                          <span className="rounded-full bg-stone-100 px-2 py-0.5 text-[10px] font-semibold text-stone-500">
                            Nonaktif
                          </span>
                        )}
                      </div>
                      <span className="block text-[11px] text-[#7A6273] mt-0.5">
                        Harga jual: <b className="text-pink-700">{formatRp(p.price)}</b> (riwayat order lama aman/snapshot)
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <ProductPriceEdit id={p.id} initialPrice={p.price} />
                      <PatchButton
                        path={`/api/products/${p.id}`}
                        body={{ isActive: !p.isActive }}
                        label={p.isActive ? "Nonaktifkan" : "Aktifkan"}
                        className={
                          p.isActive
                            ? "rounded-full bg-stone-100 border border-stone-200 px-3 py-1 text-xs font-semibold text-stone-600 hover:bg-stone-200 transition-all cursor-pointer"
                            : "rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-bold text-emerald-700 hover:bg-emerald-100 transition-all cursor-pointer"
                        }
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
