"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatRp } from "@/lib/format";

export interface ProductOpt {
  id: string;
  name: string;
  price: number;
  isActive?: boolean;
}

export interface CustomerOpt {
  id: string;
  name: string;
}

export interface QuickOrderModalProps {
  batchId: string;
  products: ProductOpt[];
  customers: CustomerOpt[];
  currentMemberId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function QuickOrderModal({
  batchId,
  products,
  customers: initialCustomers,
  currentMemberId,
  isOpen,
  onClose,
  onSuccess,
}: QuickOrderModalProps) {
  const router = useRouter();
  const [customers, setCustomers] = useState<CustomerOpt[]>(initialCustomers);
  const [customerId, setCustomerId] = useState<string>(customers[0]?.id || "");
  const [isAddingCustomer, setIsAddingCustomer] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState("");
  const [source, setSource] = useState<"langsung" | "wa" | "puskesmas">("langsung");
  const [selectedItems, setSelectedItems] = useState<Record<string, number>>({});
  const [isPaid, setIsPaid] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleClose = () => {
    setErrorMsg(null);
    setSelectedItems({});
    setIsAddingCustomer(false);
    setNewCustomerName("");
    onClose();
  };

  const activeProducts = products.filter((p) => p.isActive !== false);

  const handleAddProduct = (productId: string) => {
    setSelectedItems((prev) => ({
      ...prev,
      [productId]: (prev[productId] || 0) + 1,
    }));
  };

  const handleUpdateQty = (productId: string, delta: number) => {
    setSelectedItems((prev) => {
      const current = prev[productId] || 0;
      const next = current + delta;
      if (next <= 0) {
        const copy = { ...prev };
        delete copy[productId];
        return copy;
      }
      return { ...prev, [productId]: next };
    });
  };

  const total = Object.entries(selectedItems).reduce((sum, [pId, qty]) => {
    const prod = products.find((p) => p.id === pId);
    return sum + (prod ? prod.price * qty : 0);
  }, 0);

  const totalCups = Object.values(selectedItems).reduce((sum, q) => sum + q, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const itemsPayload = Object.entries(selectedItems)
      .filter(([_, qty]) => qty > 0)
      .map(([productId, qty]) => ({ productId, qty }));

    if (itemsPayload.length === 0) {
      setErrorMsg("Pilih minimal 1 produk");
      return;
    }

    let finalCustomerId = customerId;

    setIsSubmitting(true);
    try {
      if (isAddingCustomer) {
        const trimmed = newCustomerName.trim();
        if (!trimmed) {
          throw new Error("Nama pelanggan baru tidak boleh kosong");
        }
        const custRes = await fetch("/api/customers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: trimmed }),
        });
        if (!custRes.ok) {
          const err = await custRes.json().catch(() => ({}));
          throw new Error(err.error || "Gagal membuat pelanggan baru");
        }
        const newCust = await custRes.json();
        finalCustomerId = newCust.id;
        setCustomerId(newCust.id);
        setIsAddingCustomer(false);
        setNewCustomerName("");
        setCustomers((prev) => [...prev, { id: newCust.id, name: newCust.name }]);
      }

      if (!finalCustomerId) {
        throw new Error("Pilih pelanggan terlebih dahulu");
      }

      const orderRes = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          batchId,
          customerId: finalCustomerId,
          source,
          items: itemsPayload,
        }),
      });

      if (!orderRes.ok) {
        const err = await orderRes.json().catch(() => ({}));
        throw new Error(err.error || "Gagal mencatat order");
      }

      const order = await orderRes.json();

      let paymentFailed = false;
      if (isPaid && total > 0) {
        try {
          const payRes = await fetch("/api/payments", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              orderId: order.id,
              amount: total,
              method: "cash",
              receivedBy: currentMemberId,
            }),
          });
          if (!payRes.ok) {
            paymentFailed = true;
          }
        } catch {
          paymentFailed = true;
        }
      }

      // Reset state and refresh dashboard
      setSelectedItems({});
      setIsAddingCustomer(false);
      setNewCustomerName("");
      router.refresh();

      if (paymentFailed) {
        setErrorMsg(
          "Pesanan berhasil dicatat (status: Belum Bayar). Pembayaran otomatis gagal — silakan lunasi melalui tombol '⚡ Lunasi' di tabel."
        );
      } else {
        handleClose();
        if (onSuccess) onSuccess();
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-3 sm:p-4 backdrop-blur-xs">
      <div className="relative w-full max-w-lg rounded-2xl bg-white p-5 sm:p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-bold text-slate-900">+ Catat Penjualan Cepat</h3>
            <p className="text-xs text-slate-500">Input order langsung ke batch aktif</p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            ✕
          </button>
        </div>

        {errorMsg && (
          <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-2.5 text-xs text-amber-900 font-medium">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Quick Product Chips */}
          <div>
            <label className="text-xs font-semibold text-slate-700">Pilih Produk Cepat (Klik untuk tambah)</label>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {activeProducts.map((p) => {
                const qty = selectedItems[p.id] || 0;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleAddProduct(p.id)}
                    className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-all ${
                      qty > 0
                        ? "border-emerald-500 bg-emerald-50 text-emerald-800 shadow-xs font-semibold"
                        : "border-slate-200 bg-slate-50/70 text-slate-700 hover:border-emerald-300 hover:bg-emerald-50/50"
                    }`}
                  >
                    <span>{p.name}</span>
                    <span className="text-[10px] text-slate-500">({formatRp(p.price)})</span>
                    {qty > 0 && (
                      <span className="ml-0.5 rounded-full bg-emerald-600 px-1.5 py-0.2 text-[10px] text-white">
                        {qty}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected Items Breakdown */}
          {Object.keys(selectedItems).length > 0 && (
            <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3 space-y-2">
              <div className="flex justify-between text-xs font-semibold text-slate-700 border-b border-slate-200/60 pb-1.5">
                <span>Daftar Pesanan ({totalCups} cup)</span>
                <span>Subtotal</span>
              </div>
              {Object.entries(selectedItems).map(([pId, qty]) => {
                const prod = products.find((p) => p.id === pId);
                if (!prod) return null;
                return (
                  <div key={pId} className="flex items-center justify-between text-xs py-0.5">
                    <span className="font-medium text-slate-800">{prod.name}</span>
                    <div className="flex items-center gap-2">
                      <div className="inline-flex items-center rounded-md border border-slate-200 bg-white shadow-2xs">
                        <button
                          type="button"
                          onClick={() => handleUpdateQty(pId, -1)}
                          className="px-2 py-0.5 text-slate-600 hover:bg-slate-100 rounded-l-md font-bold"
                        >
                          -
                        </button>
                        <span className="px-2 font-semibold text-slate-900">{qty}</span>
                        <button
                          type="button"
                          onClick={() => handleUpdateQty(pId, 1)}
                          className="px-2 py-0.5 text-slate-600 hover:bg-slate-100 rounded-r-md font-bold"
                        >
                          +
                        </button>
                      </div>
                      <span className="w-20 text-right font-medium text-slate-900">
                        {formatRp(prod.price * qty)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Customer Selection */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-700 mb-0">Pelanggan</label>
              <button
                type="button"
                onClick={() => setIsAddingCustomer(!isAddingCustomer)}
                className="text-[11px] font-semibold text-emerald-700 hover:underline"
              >
                {isAddingCustomer ? "Pilih dari daftar" : "+ Pelanggan baru"}
              </button>
            </div>

            {isAddingCustomer ? (
              <input
                type="text"
                placeholder="Nama pelanggan baru (wajib)..."
                value={newCustomerName}
                onChange={(e) => setNewCustomerName(e.target.value)}
                autoFocus
                required
              />
            ) : (
              <select
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                required
              >
                <option value="" disabled>-- Pilih Pelanggan --</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Source and Payment Status */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700">Sumber Order</label>
              <select
                value={source}
                onChange={(e) => setSource(e.target.value as "langsung" | "wa" | "puskesmas")}
              >
                <option value="langsung">Langsung (Stand / Outlet)</option>
                <option value="wa">WhatsApp (WA)</option>
                <option value="puskesmas">Puskesmas</option>
              </select>
            </div>

            <div className="flex items-center pt-5">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isPaid}
                  onChange={(e) => setIsPaid(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-xs font-semibold text-slate-800">Langsung Lunas (Tunai)</span>
              </label>
            </div>
          </div>

          {/* Total & Action Buttons */}
          <div className="border-t border-slate-100 pt-4 flex items-center justify-between">
            <div>
              <span className="block text-[11px] text-slate-500">Total Pembayaran</span>
              <span className="text-xl font-extrabold text-emerald-700">{formatRp(total)}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleClose}
                disabled={isSubmitting}
                className="rounded-lg border border-slate-200 px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSubmitting || total === 0}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700 disabled:opacity-50 transition-colors"
              >
                {isSubmitting ? "Menyimpan..." : "Simpan Pesanan"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
