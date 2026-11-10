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
  "rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-50";
const card = "rounded-2xl border border-amber-200 bg-white p-4 shadow-sm";

export function ErrorText({ error }: { error: string | null }) {
  if (!error) return null;
  return <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>;
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
      className="text-xs font-medium text-red-600 underline disabled:opacity-50"
    >
      {label}
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
        className={className ?? "text-xs font-medium text-amber-700 underline disabled:opacity-50"}
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
      <h3 className="mb-3 font-semibold">Buat Batch Baru</h3>
      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <label>Tanggal produksi</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
        </div>
        <div>
          <label>Judul (opsional)</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="mis. Batch Senin" />
        </div>
        <div>
          <label>Modal awal (Rp)</label>
          <input type="number" min="0" value={capital} onChange={(e) => setCapital(e.target.value)} />
        </div>
      </div>
      <button className={`${btn} mt-3`} disabled={busy}>
        + Buat Batch
      </button>
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
      <h3 className="mb-3 font-semibold">Tambah Pengeluaran</h3>
      <div className="grid gap-3 sm:grid-cols-4">
        <div className="sm:col-span-2">
          <label>Keterangan</label>
          <input value={description} onChange={(e) => setDescription(e.target.value)} required placeholder="mis. Gula dan lombok" />
        </div>
        <div>
          <label>Jumlah (Rp)</label>
          <input type="number" min="1" value={amount} onChange={(e) => setAmount(e.target.value)} required />
        </div>
        <div>
          <label>Dibayar oleh</label>
          <select value={paidBy} onChange={(e) => setPaidBy(e.target.value)}>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      <button className={`${btn} mt-3`} disabled={busy}>
        + Tambah
      </button>
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
      <h3 className="mb-3 font-semibold">Tambah Order</h3>
      <div className="grid gap-3 sm:grid-cols-2">
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
          <label>Sumber order</label>
          <select value={source} onChange={(e) => setSource(e.target.value)}>
            <option value="wa">WhatsApp</option>
            <option value="langsung">Langsung</option>
            <option value="puskesmas">Teman Puskesmas</option>
          </select>
        </div>
      </div>
      <div className="mt-3 space-y-2">
        {items.map((item, idx) => (
          <div key={idx} className="flex items-end gap-2">
            <div className="flex-1">
              <label>Produk</label>
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
            <div className="w-24">
              <label>Qty</label>
              <input
                type="number"
                min="1"
                value={item.qty}
                onChange={(e) => {
                  const next = [...items];
                  next[idx] = { ...next[idx], qty: Number(e.target.value) };
                  setItems(next);
                }}
              />
            </div>
            {items.length > 1 && (
              <button
                type="button"
                className="pb-2 text-xs text-red-600 underline"
                onClick={() => setItems(items.filter((_, i) => i !== idx))}
              >
                Hapus
              </button>
            )}
          </div>
        ))}
        <button
          type="button"
          className="text-xs font-medium text-amber-700 underline"
          onClick={() =>
            setItems([...items, { productId: activeProducts[0]?.id ?? "", qty: 1 }])
          }
        >
          + Item lain
        </button>
      </div>
      <button className={`${btn} mt-3`} disabled={busy || customers.length === 0}>
        + Tambah Order
      </button>
      {customers.length === 0 && (
        <p className="mt-2 text-xs text-stone-500">
          Belum ada pelanggan — tambahkan dulu di halaman Pelanggan.
        </p>
      )}
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
        className="text-xs font-semibold text-emerald-700 underline"
      >
        Tandai sudah bayar
      </button>
    );
  }
  return (
    <form
      className="mt-2 rounded-lg bg-emerald-50 p-3"
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
      <div className="grid gap-2 sm:grid-cols-3">
        <div>
          <label>Jumlah (Rp)</label>
          <input type="number" min="1" value={amount} onChange={(e) => setAmount(e.target.value)} required />
        </div>
        <div>
          <label>Metode</label>
          <select value={method} onChange={(e) => setMethod(e.target.value)}>
            <option value="cash">Tunai</option>
            <option value="transfer">Transfer</option>
          </select>
        </div>
        <div>
          <label>Diterima oleh</label>
          <select value={receivedBy} onChange={(e) => setReceivedBy(e.target.value)}>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="mt-2 flex gap-2">
        <button className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50" disabled={busy}>
          Simpan Pembayaran
        </button>
        <button type="button" className="text-xs underline" onClick={() => setOpen(false)}>
          Batal
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
      <h3 className="mb-3 font-semibold">Catat Setoran ke Bendahara</h3>
      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <label>Yang menyetor</label>
          <select value={memberId} onChange={(e) => setMemberId(e.target.value)}>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label>Jumlah (Rp)</label>
          <input type="number" min="1" value={amount} onChange={(e) => setAmount(e.target.value)} required />
        </div>
        <div className="flex items-end">
          <button className={btn} disabled={busy}>
            + Catat Setoran
          </button>
        </div>
      </div>
      <p className="mt-2 text-xs text-stone-500">
        Setoran berstatus <b>menunggu</b> sampai bendahara mengonfirmasi diterima.
      </p>
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
      <h3 className="mb-3 font-semibold">Catat Talangan Modal</h3>
      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <label>Yang menalangi</label>
          <select value={memberId} onChange={(e) => setMemberId(e.target.value)}>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label>Jumlah (Rp)</label>
          <input type="number" min="1" value={amount} onChange={(e) => setAmount(e.target.value)} required />
        </div>
        <div className="flex items-end">
          <button className={btn} disabled={busy}>
            + Catat Talangan
          </button>
        </div>
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
      <h3 className="mb-3 font-semibold">Catat Alokasi Laba</h3>
      <div className="grid gap-3 sm:grid-cols-4">
        <div>
          <label>Jenis</label>
          <select value={kind} onChange={(e) => setKind(e.target.value)}>
            <option value="diputar">Diputar jadi modal</option>
            <option value="ditahan">Ditahan di kas</option>
            <option value="dibagi">Dibagi ke anggota</option>
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
          <input type="number" min="1" value={amount} onChange={(e) => setAmount(e.target.value)} required />
        </div>
        <div>
          <label>Catatan (opsional)</label>
          <input value={note} onChange={(e) => setNote(e.target.value)} />
        </div>
      </div>
      <button className={`${btn} mt-3`} disabled={busy}>
        + Tambah Alokasi
      </button>
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
      <h3 className="mb-3 font-semibold">Tambah Pelanggan</h3>
      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <label>Nama</label>
          <input value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div>
          <label>Catatan (opsional)</label>
          <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="mis. Puskesmas" />
        </div>
        <div className="flex items-end">
          <button className={btn} disabled={busy}>
            + Tambah
          </button>
        </div>
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
      <button type="button" className="text-xs font-medium text-amber-700 underline" onClick={() => setOpen(true)}>
        Ubah
      </button>
    );
  return (
    <form
      className="mt-2 flex flex-wrap items-end gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        void run(() => api(`/api/customers/${id}`, "PATCH", { name, note: note || null }));
      }}
    >
      <div>
        <label>Nama</label>
        <input value={name} onChange={(e) => setName(e.target.value)} required />
      </div>
      <div>
        <label>Catatan</label>
        <input value={note} onChange={(e) => setNote(e.target.value)} />
      </div>
      <button className="rounded-lg bg-amber-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50" disabled={busy}>
        Simpan
      </button>
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
      <h3 className="mb-3 font-semibold">Tambah Anggota (whitelist login Google)</h3>
      <div className="grid gap-3 sm:grid-cols-4">
        <div>
          <label>Nama</label>
          <input value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div>
          <label>Email Google</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div>
          <label>Peran</label>
          <select value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="anggota">Anggota</option>
            <option value="bendahara">Bendahara</option>
          </select>
        </div>
        <div className="flex items-end">
          <button className={btn} disabled={busy}>
            + Tambah
          </button>
        </div>
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
      <h3 className="mb-3 font-semibold">Tambah Produk</h3>
      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <label>Nama produk</label>
          <input value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div>
          <label>Harga (Rp)</label>
          <input type="number" min="1" value={price} onChange={(e) => setPrice(e.target.value)} required />
        </div>
        <div className="flex items-end">
          <button className={btn} disabled={busy}>
            + Tambah
          </button>
        </div>
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
      className="flex items-end gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        void run(() => api(`/api/products/${id}`, "PATCH", { price: Number(price) }));
      }}
    >
      <div className="w-32">
        <label>Harga (Rp)</label>
        <input type="number" min="1" value={price} onChange={(e) => setPrice(e.target.value)} />
      </div>
      <button className="rounded-lg bg-amber-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50" disabled={busy}>
        Simpan
      </button>
      <ErrorText error={error} />
    </form>
  );
}
