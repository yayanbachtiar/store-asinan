"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type MemberOpt = { id: string; name: string; role?: string };
type CustomerOpt = { id: string; name: string };
type ProductOpt = { id: string; name: string; price: number; isActive?: boolean };

async function api(path: string, method: string, body?: unknown): Promise<string | null> {
  const res = await fetch(path, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const data = (await res.json().catch(() => null)) as { error?: string } | null;
    return data?.error ?? `Gagal (${res.status})`;
  }
  return null;
}

function useSubmit() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const run = async (fn: () => Promise<string | null>, reset?: () => void) => {
    setBusy(true);
    setError(null);
    const err = await fn();
    setBusy(false);
    if (err) setError(err);
    else {
      reset?.();
      router.refresh();
    }
  };
  return { error, busy, run };
}

const btn =
  "inline-flex items-center justify-center gap-1.5 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:shadow-sm active:scale-95 disabled:opacity-50 transition-all cursor-pointer";
const card =
  "rounded-3xl border border-pink-200/90 bg-white p-5 sm:p-6 shadow-xs transition-all hover:border-pink-300";

export function ErrorText({ error }: { error: string | null }) {
  if (!error) return null;
  return (
    <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-rose-50 border border-rose-200 px-3.5 py-1 text-xs font-semibold text-rose-700">
      <span>⚠️</span>
      <span>{error}</span>
    </div>
  );
}

/* ---------------- Tombol generik ---------------- */

export function DeleteButton({ path, label = "Hapus" }: { path: string; label?: string }) {
  const { run, busy } = useSubmit();
  return (
    <button
      type="button"
      disabled={busy}
      onClick={() => {
        if (confirm("Hapus data ini?")) void run(() => api(path, "DELETE"));
      }}
      className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50 active:scale-95 disabled:opacity-50 transition-all cursor-pointer"
    >
      <span>🗑️</span>
      <span>{label}</span>
    </button>
  );
}

export function PatchButton({
  path,
  body,
  label,
  className,
}: {
  path: string;
  body: unknown;
  label: string;
  className?: string;
}) {
  const { run, busy, error } = useSubmit();
  return (
    <span>
      <button
        type="button"
        disabled={busy}
        onClick={() => void run(() => api(path, "PATCH", body))}
        className={
          className ??
          "inline-flex items-center gap-1 rounded-full bg-pink-50 border border-pink-200 px-3 py-1 text-xs font-bold text-pink-700 hover:bg-pink-100 hover:border-pink-300 active:scale-95 disabled:opacity-50 transition-all cursor-pointer"
        }
      >
        {label}
      </button>
      <ErrorText error={error} />
    </span>
  );
}

/* ---------------- Batch ---------------- */

export function BatchForm() {
  const { error, busy, run } = useSubmit();
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [title, setTitle] = useState("");
  const [capital, setCapital] = useState("0");
  return (
    <form
      className={card}
      onSubmit={(e) => {
        e.preventDefault();
        void run(
          () =>
            api("/api/batches", "POST", {
              date,
              title: title || undefined,
              initialCapital: Number(capital) || 0,
            }),
          () => setTitle(""),
        );
      }}
    >
      <div className="mb-4 flex items-center justify-between border-b border-pink-100/80 pb-3">
        <h3 className="font-extrabold text-sm text-[#2D1B2D] flex items-center gap-2">
          <span>🧺</span>
          <span>Buka Batch Produksi Baru</span>
        </h3>
        <span className="text-[11px] font-bold text-pink-600 bg-pink-50 border border-pink-200/80 rounded-full px-2.5 py-0.5">
          Sesi Baru
        </span>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label>Tanggal Produksi</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
        </div>
        <div>
          <label>Nama / Judul Batch (opsional)</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="mis. Batch Senin Manis" />
        </div>
        <div>
          <label>Modal Awal (Rp)</label>
          <input type="number" min="0" value={capital} onChange={(e) => setCapital(e.target.value)} />
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-pink-50 flex items-center justify-end">
        <button className={btn} disabled={busy}>
          ✨ + Buat Batch
        </button>
      </div>
      <ErrorText error={error} />
    </form>
  );
}

/* ---------------- Pengeluaran ---------------- */

export function ExpenseForm({ batchId, members }: { batchId: string; members: MemberOpt[] }) {
  const { error, busy, run } = useSubmit();
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [paidBy, setPaidBy] = useState(members[0]?.id ?? "");
  return (
    <form
      className={card}
      onSubmit={(e) => {
        e.preventDefault();
        void run(
          () =>
            api("/api/expenses", "POST", {
              batchId,
              description,
              amount: Number(amount),
              paidBy,
            }),
          () => {
            setDescription("");
            setAmount("");
          },
        );
      }}
    >
      <div className="mb-4 flex items-center justify-between border-b border-pink-100/80 pb-3">
        <h3 className="font-extrabold text-sm text-[#2D1B2D] flex items-center gap-2">
          <span>🧾</span>
          <span>Catat Belanja Bahan (HPP)</span>
        </h3>
        <span className="text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200/80 rounded-full px-2.5 py-0.5">
          Biaya Modal
        </span>
      </div>

      <div className="grid gap-4 sm:grid-cols-12">
        <div className="sm:col-span-5">
          <label>Keterangan Belanja</label>
          <input value={description} onChange={(e) => setDescription(e.target.value)} required placeholder="mis. Gula pasir, cabe rawit, cup 300ml" />
        </div>
        <div className="sm:col-span-3">
          <label>Jumlah Biaya (Rp)</label>
          <input type="number" min="1" value={amount} onChange={(e) => setAmount(e.target.value)} required placeholder="0" />
        </div>
        <div className="sm:col-span-4">
          <label>Dibayar Oleh</label>
          <select value={paidBy} onChange={(e) => setPaidBy(e.target.value)}>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-pink-50 flex items-center justify-end">
        <button className={btn} disabled={busy}>
          + Tambah Pengeluaran
        </button>
      </div>
      <ErrorText error={error} />
    </form>
  );
}

/* ---------------- Order ---------------- */

export function OrderForm({
  batchId,
  customers,
  products,
}: {
  batchId: string;
  customers: CustomerOpt[];
  products: ProductOpt[];
}) {
  const { error, busy, run } = useSubmit();
  const [customerId, setCustomerId] = useState(customers[0]?.id ?? "");
  const [source, setSource] = useState("wa");
  const [items, setItems] = useState<{ productId: string; qty: number }[]>([
    { productId: products[0]?.id ?? "", qty: 1 },
  ]);
  const activeProducts = products.filter((p) => p.isActive !== false);

  return (
    <form
      className={card}
      onSubmit={(e) => {
        e.preventDefault();
        void run(() =>
          api("/api/orders", "POST", {
            batchId,
            customerId,
            source,
            items: items.filter((i) => i.productId !== "" && i.qty > 0),
          }),
        );
      }}
    >
      <div className="mb-4 flex items-center justify-between border-b border-pink-100/80 pb-3">
        <h3 className="font-extrabold text-sm text-[#2D1B2D] flex items-center gap-2">
          <span>🛍️</span>
          <span>Tambah Order Baru</span>
        </h3>
        <span className="text-[11px] font-bold text-rose-700 bg-rose-50 border border-rose-200/80 rounded-full px-2.5 py-0.5">
          Penjualan
        </span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label>Pelanggan</label>
          <select value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label>Sumber Order</label>
          <select value={source} onChange={(e) => setSource(e.target.value)}>
            <option value="wa">💬 WhatsApp</option>
            <option value="langsung">🏪 Langsung / Stand</option>
            <option value="puskesmas">🏥 Teman Puskesmas</option>
          </select>
        </div>
      </div>

      <div className="mt-4 rounded-2xl bg-pink-50/40 border border-pink-100 p-3.5 space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-[#7A6273] mb-0">Rincian Item Cup</label>
          <button
            type="button"
            className="inline-flex items-center gap-1 rounded-full bg-white border border-pink-200 px-3 py-1 text-xs font-bold text-pink-700 hover:bg-pink-50 transition-all cursor-pointer"
            onClick={() =>
              setItems([...items, { productId: activeProducts[0]?.id ?? "", qty: 1 }])
            }
          >
            + Tambah Varian
          </button>
        </div>

        {items.map((item, idx) => (
          <div key={idx} className="flex items-center gap-2.5">
            <div className="flex-1">
              <select
                value={item.productId}
                onChange={(e) => {
                  const next = [...items];
                  next[idx] = { ...next[idx], productId: e.target.value };
                  setItems(next);
                }}
              >
                {activeProducts.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} — Rp{p.price.toLocaleString("id-ID")}
                  </option>
                ))}
              </select>
            </div>
            <div className="w-28 shrink-0">
              <input
                type="number"
                min="1"
                value={item.qty}
                onChange={(e) => {
                  const next = [...items];
                  next[idx] = { ...next[idx], qty: Number(e.target.value) };
                  setItems(next);
                }}
                placeholder="Qty"
              />
            </div>
            {items.length > 1 && (
              <button
                type="button"
                className="rounded-full p-2 text-rose-500 hover:bg-rose-50 transition-colors cursor-pointer"
                onClick={() => setItems(items.filter((_, i) => i !== idx))}
                title="Hapus baris"
              >
                ✕
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="mt-4 pt-3 border-t border-pink-50 flex items-center justify-between flex-wrap gap-2">
        {customers.length === 0 ? (
          <p className="text-xs text-amber-700">
            ⚠️ Belum ada pelanggan — tambahkan dulu di tab Pelanggan ya.
          </p>
        ) : (
          <span className="text-xs text-[#7A6273]">
            {items.reduce((s, i) => s + (Number(i.qty) || 0), 0)} cup dipilih
          </span>
        )}
        <button className={btn} disabled={busy || customers.length === 0}>
          + Simpan Order
        </button>
      </div>
      <ErrorText error={error} />
    </form>
  );
}

/* ---------------- Pembayaran ---------------- */

export function PaymentForm({
  orderId,
  defaultAmount,
  members,
}: {
  orderId: string;
  defaultAmount: number;
  members: MemberOpt[];
}) {
  const { error, busy, run } = useSubmit();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState(String(defaultAmount));
  const [method, setMethod] = useState("cash");
  const [receivedBy, setReceivedBy] = useState(members[0]?.id ?? "");

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-bold text-emerald-700 hover:bg-emerald-100 transition-all cursor-pointer"
      >
        <span>💸</span>
        <span>Tandai sudah bayar</span>
      </button>
    );
  }

  return (
    <form
      className="mt-2.5 rounded-2xl border border-emerald-200/80 bg-emerald-50/60 p-4 shadow-2xs space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        void run(() =>
          api("/api/payments", "POST", {
            orderId,
            amount: Number(amount),
            method,
            receivedBy,
          }),
        );
      }}
    >
      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <label>Jumlah Pelunasan (Rp)</label>
          <input type="number" min="1" value={amount} onChange={(e) => setAmount(e.target.value)} required />
        </div>
        <div>
          <label>Metode Pembayaran</label>
          <select value={method} onChange={(e) => setMethod(e.target.value)}>
            <option value="cash">💵 Tunai / Cash</option>
            <option value="transfer">📱 QRIS / Transfer</option>
          </select>
        </div>
        <div>
          <label>Uang Diterima Oleh</label>
          <select value={receivedBy} onChange={(e) => setReceivedBy(e.target.value)}>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="flex items-center justify-end gap-2 pt-2 border-t border-emerald-100">
        <button
          type="button"
          className="rounded-full px-3 py-1.5 text-xs text-[#7A6273] hover:underline"
          onClick={() => setOpen(false)}
        >
          Batal
        </button>
        <button
          className="rounded-full bg-emerald-600 hover:bg-emerald-700 px-4 py-1.5 text-xs font-bold text-white shadow-xs transition-all disabled:opacity-50 cursor-pointer"
          disabled={busy}
        >
          Simpan Pelunasan
        </button>
      </div>
      <ErrorText error={error} />
    </form>
  );
}

/* ---------------- Setoran ---------------- */

export function SettlementForm({ members }: { members: MemberOpt[] }) {
  const { error, busy, run } = useSubmit();
  const [memberId, setMemberId] = useState(members[0]?.id ?? "");
  const [amount, setAmount] = useState("");
  return (
    <form
      className={card}
      onSubmit={(e) => {
        e.preventDefault();
        void run(
          () => api("/api/settlements", "POST", { memberId, amount: Number(amount) }),
          () => setAmount(""),
        );
      }}
    >
      <div className="mb-4 flex items-center justify-between border-b border-pink-100/80 pb-3">
        <h3 className="font-extrabold text-sm text-[#2D1B2D] flex items-center gap-2">
          <span>💰</span>
          <span>Catat Setoran Uang ke Bendahara</span>
        </h3>
        <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/80 rounded-full px-2.5 py-0.5">
          Kas Masuk
        </span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label>Anggota yang Menyetor</label>
          <select value={memberId} onChange={(e) => setMemberId(e.target.value)}>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label>Jumlah Uang Setoran (Rp)</label>
          <input type="number" min="1" value={amount} onChange={(e) => setAmount(e.target.value)} required placeholder="mis. 150000" />
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-pink-50 flex items-center justify-between">
        <p className="text-[11px] text-[#7A6273]">
          💡 Status langsung <b>menunggu</b> konfirmasi bendahara.
        </p>
        <button className={btn} disabled={busy}>
          + Kirim Setoran
        </button>
      </div>
      <ErrorText error={error} />
    </form>
  );
}

/* ---------------- Talangan ---------------- */

export function AdvanceForm({ batchId, members }: { batchId: string; members: MemberOpt[] }) {
  const { error, busy, run } = useSubmit();
  const [memberId, setMemberId] = useState(members[0]?.id ?? "");
  const [amount, setAmount] = useState("");
  return (
    <form
      className={card}
      onSubmit={(e) => {
        e.preventDefault();
        void run(
          () =>
            api("/api/advances", "POST", {
              batchId,
              memberId,
              amount: Number(amount),
            }),
          () => setAmount(""),
        );
      }}
    >
      <div className="mb-4 flex items-center justify-between border-b border-pink-100/80 pb-3">
        <h3 className="font-extrabold text-sm text-[#2D1B2D] flex items-center gap-2">
          <span>🤝</span>
          <span>Catat Talangan Modal Pribadi</span>
        </h3>
        <span className="text-[11px] font-bold text-purple-700 bg-purple-50 border border-purple-200/80 rounded-full px-2.5 py-0.5">
          Talangan
        </span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label>Anggota yang Menalangi</label>
          <select value={memberId} onChange={(e) => setMemberId(e.target.value)}>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label>Nominal Ditalangi (Rp)</label>
          <input type="number" min="1" value={amount} onChange={(e) => setAmount(e.target.value)} required placeholder="mis. 50000" />
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-pink-50 flex items-center justify-end">
        <button className={btn} disabled={busy}>
          + Simpan Talangan
        </button>
      </div>
      <ErrorText error={error} />
    </form>
  );
}

/* ---------------- Alokasi laba ---------------- */

export function AllocationForm({ batchId, members }: { batchId: string; members: MemberOpt[] }) {
  const { error, busy, run } = useSubmit();
  const [kind, setKind] = useState("diputar");
  const [memberId, setMemberId] = useState(members[0]?.id ?? "");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");

  return (
    <form
      className={card}
      onSubmit={(e) => {
        e.preventDefault();
        void run(
          () =>
            api("/api/allocations", "POST", {
              batchId,
              kind,
              memberId: kind === "dibagi" ? memberId : null,
              amount: Number(amount),
              note: note || undefined,
            }),
          () => {
            setAmount("");
            setNote("");
          },
        );
      }}
    >
      <div className="mb-4 flex items-center justify-between border-b border-pink-100/80 pb-3">
        <h3 className="font-extrabold text-sm text-[#2D1B2D] flex items-center gap-2">
          <span>📊</span>
          <span>Catat Alokasi Laba Bersih</span>
        </h3>
        <span className="text-[11px] font-bold text-rose-700 bg-rose-50 border border-rose-200/80 rounded-full px-2.5 py-0.5">
          Distribusi Laba
        </span>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label>Jenis Alokasi</label>
          <select value={kind} onChange={(e) => setKind(e.target.value)}>
            <option value="diputar">🔄 Diputar jadi modal</option>
            <option value="ditahan">🏦 Ditahan di kas</option>
            <option value="dibagi">👥 Dibagi ke anggota</option>
          </select>
        </div>
        {kind === "dibagi" && (
          <div>
            <label>Dibagikan ke</label>
            <select value={memberId} onChange={(e) => setMemberId(e.target.value)}>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>
        )}
        <div>
          <label>Jumlah (Rp)</label>
          <input type="number" min="1" value={amount} onChange={(e) => setAmount(e.target.value)} required placeholder="0" />
        </div>
        <div>
          <label>Catatan (opsional)</label>
          <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="mis. Bagian laba Husein" />
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-pink-50 flex items-center justify-end">
        <button className={btn} disabled={busy}>
          + Tambah Alokasi
        </button>
      </div>
      <ErrorText error={error} />
    </form>
  );
}

/* ---------------- Pelanggan ---------------- */

export function CustomerForm() {
  const { error, busy, run } = useSubmit();
  const [name, setName] = useState("");
  const [note, setNote] = useState("");
  return (
    <form
      className={card}
      onSubmit={(e) => {
        e.preventDefault();
        void run(
          () => api("/api/customers", "POST", { name, note: note || undefined }),
          () => {
            setName("");
            setNote("");
          },
        );
      }}
    >
      <div className="mb-4 flex items-center justify-between border-b border-pink-100/80 pb-3">
        <h3 className="font-extrabold text-sm text-[#2D1B2D] flex items-center gap-2">
          <span>👥</span>
          <span>Tambah Pelanggan Baru</span>
        </h3>
        <span className="text-[11px] font-bold text-pink-700 bg-pink-50 border border-pink-200/80 rounded-full px-2.5 py-0.5">
          Kontak
        </span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label>Nama Pelanggan</label>
          <input value={name} onChange={(e) => setName(e.target.value)} required placeholder="mis. Bu Dokter Ani" />
        </div>
        <div>
          <label>Catatan / Lokasi (opsional)</label>
          <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="mis. Puskesmas Lt. 2" />
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-pink-50 flex items-center justify-end">
        <button className={btn} disabled={busy}>
          + Simpan Pelanggan
        </button>
      </div>
      <ErrorText error={error} />
    </form>
  );
}

export function CustomerEdit({
  id,
  initialName,
  initialNote,
}: {
  id: string;
  initialName: string;
  initialNote: string | null;
}) {
  const { error, busy, run } = useSubmit();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(initialName);
  const [note, setNote] = useState(initialNote ?? "");

  if (!open)
    return (
      <button
        type="button"
        className="inline-flex items-center gap-1 rounded-full bg-pink-50 border border-pink-200 px-3 py-1 text-xs font-bold text-pink-700 hover:bg-pink-100 transition-all cursor-pointer"
        onClick={() => setOpen(true)}
      >
        ✏️ Ubah
      </button>
    );

  return (
    <form
      className="mt-3 rounded-2xl border border-pink-200 bg-pink-50/50 p-4 space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        void run(() => api(`/api/customers/${id}`, "PATCH", { name, note: note || null }));
      }}
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label>Nama Pelanggan</label>
          <input value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div>
          <label>Catatan</label>
          <input value={note} onChange={(e) => setNote(e.target.value)} />
        </div>
      </div>
      <div className="flex items-center justify-end gap-2 pt-2 border-t border-pink-100">
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-xs text-[#7A6273] hover:underline px-3 py-1"
        >
          Batal
        </button>
        <button
          className="rounded-full bg-gradient-to-r from-pink-500 to-rose-500 px-4 py-1.5 text-xs font-bold text-white shadow-xs hover:from-pink-600 hover:to-rose-600 disabled:opacity-50 transition-all cursor-pointer"
          disabled={busy}
        >
          Simpan Perubahan
        </button>
      </div>
      <ErrorText error={error} />
    </form>
  );
}

/* ---------------- Pengaturan: anggota & produk ---------------- */

export function MemberForm() {
  const { error, busy, run } = useSubmit();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("anggota");
  return (
    <form
      className={card}
      onSubmit={(e) => {
        e.preventDefault();
        void run(
          () => api("/api/members", "POST", { name, email, role }),
          () => {
            setName("");
            setEmail("");
          },
        );
      }}
    >
      <div className="mb-4 flex items-center justify-between border-b border-pink-100/80 pb-3">
        <h3 className="font-extrabold text-sm text-[#2D1B2D] flex items-center gap-2">
          <span>👑</span>
          <span>Tambah Anggota Tim (Whitelist Google)</span>
        </h3>
        <span className="text-[11px] font-bold text-purple-700 bg-purple-50 border border-purple-200/80 rounded-full px-2.5 py-0.5">
          Akses Tim
        </span>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label>Nama Anggota</label>
          <input value={name} onChange={(e) => setName(e.target.value)} required placeholder="mis. Husein" />
        </div>
        <div>
          <label>Email Akun Google</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="nama@gmail.com" />
        </div>
        <div>
          <label>Peran / Role</label>
          <select value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="anggota">🌸 Anggota</option>
            <option value="bendahara">👑 Bendahara</option>
          </select>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-pink-50 flex items-center justify-end">
        <button className={btn} disabled={busy}>
          + Daftarkan Anggota
        </button>
      </div>
      <ErrorText error={error} />
    </form>
  );
}

export function ProductForm() {
  const { error, busy, run } = useSubmit();
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  return (
    <form
      className={card}
      onSubmit={(e) => {
        e.preventDefault();
        void run(
          () => api("/api/products", "POST", { name, price: Number(price) }),
          () => {
            setName("");
            setPrice("");
          },
        );
      }}
    >
      <div className="mb-4 flex items-center justify-between border-b border-pink-100/80 pb-3">
        <h3 className="font-extrabold text-sm text-[#2D1B2D] flex items-center gap-2">
          <span>🍧</span>
          <span>Tambah Varian Asinan Baru</span>
        </h3>
        <span className="text-[11px] font-bold text-pink-700 bg-pink-50 border border-pink-200/80 rounded-full px-2.5 py-0.5">
          Produk
        </span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label>Nama Varian Produk</label>
          <input value={name} onChange={(e) => setName(e.target.value)} required placeholder="mis. Asinan Buah Segar Cup 300ml" />
        </div>
        <div>
          <label>Harga Jual (Rp)</label>
          <input type="number" min="1" value={price} onChange={(e) => setPrice(e.target.value)} required placeholder="mis. 15000" />
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-pink-50 flex items-center justify-end">
        <button className={btn} disabled={busy}>
          + Tambah Produk
        </button>
      </div>
      <ErrorText error={error} />
    </form>
  );
}

export function ProductPriceEdit({ id, initialPrice }: { id: string; initialPrice: number }) {
  const { error, busy, run } = useSubmit();
  const [price, setPrice] = useState(String(initialPrice));
  return (
    <form
      className="flex items-center gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        void run(() => api(`/api/products/${id}`, "PATCH", { price: Number(price) }));
      }}
    >
      <div className="w-32">
        <input type="number" min="1" value={price} onChange={(e) => setPrice(e.target.value)} />
      </div>
      <button
        className="rounded-full bg-gradient-to-r from-pink-500 to-rose-500 px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:from-pink-600 hover:to-rose-600 disabled:opacity-50 transition-all cursor-pointer shrink-0"
        disabled={busy}
      >
        Simpan
      </button>
      <ErrorText error={error} />
    </form>
  );
}
