"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatRp } from "@/lib/format";
import { CuteBananaMascot } from "@/components/CuteBananaMascot";

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
      setErrorMsg("Pilih minimal 1 produk cup asinan ya 🌸");
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
          "Pesanan berhasil dicatat (status: Belum Bayar). Pembayaran otomatis gagal — silakan lunasi melalui tombol '✨ Lunasi' di tabel ya."
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#2D1B2D]/40 p-3 sm:p-4 backdrop-blur-xs">
      <div className="relative w-full max-w-lg rounded-3xl bg-[#FFFDF9] border border-pink-200 p-5 sm:p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-pink-100 pb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-pink-100 to-rose-100 p-1 shadow-2xs">
              <CuteBananaMascot variant="welcome" size={36} />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-[#2D1B2D]">
                + Catat Penjualan Cepat
              </h3>
              <p className="text-xs text-[#7A6273]">
                Input order langsung ke batch aktif dengan format instan
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-full p-2 text-pink-400 hover:bg-pink-100/60 hover:text-pink-600 transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        {errorMsg && (
          <div className="mt-3 rounded-2xl border border-rose-200 bg-rose-50/90 p-3 text-xs text-rose-800 font-medium">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Quick Product Sticker Chips */}
          <div>
            <label className="text-xs font-bold text-[#7A6273] flex items-center justify-between">
              <span>Pilih Produk Asinan (Klik stiker untuk tambah)</span>
              <span className="text-[10px] font-normal text-pink-500">✨ Cepat &amp; Praktis</span>
            </label>
            <div className="mt-2 flex flex-wrap gap-2">
              {activeProducts.map((p) => {
                const qty = selectedItems[p.id] || 0;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleAddProduct(p.id)}
                    className={`group relative inline-flex items-center gap-2 rounded-2xl border-2 px-3 py-2 text-xs font-semibold transition-all duration-150 active:scale-95 ${
                      qty > 0
                        ? "border-pink-400 bg-pink-100/70 text-pink-900 shadow-sm shadow-pink-200"
                        : "border-pink-200/70 bg-white text-[#2D1B2D] hover:border-pink-300 hover:bg-pink-50/60"
                    }`}
                  >
                    <span>🍧 {p.name}</span>
                    <span className="text-[11px] font-bold text-pink-700">
                      {formatRp(p.price)}
                    </span>
                    {qty > 0 && (
                      <span className="ml-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-gradient-to-r from-pink-500 to-rose-500 px-1.5 text-[10px] font-black text-white shadow-2xs">
                        {qty}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected Items Breakdown: Cute Receipt Style */}
          {Object.keys(selectedItems).length > 0 && (
            <div className="rounded-2xl border-2 border-dashed border-pink-200 bg-pink-50/40 p-3.5 space-y-2">
              <div className="flex justify-between text-xs font-bold text-pink-900 border-b border-pink-200/60 pb-1.5">
                <span>Daftar Pesanan ({totalCups} cup)</span>
                <span>Subtotal</span>
              </div>
              {Object.entries(selectedItems).map(([pId, qty]) => {
                const prod = products.find((p) => p.id === pId);
                if (!prod) return null;
                return (
                  <div key={pId} className="flex items-center justify-between text-xs py-1">
                    <span className="font-semibold text-[#2D1B2D]">{prod.name}</span>
                    <div className="flex items-center gap-2.5">
                      <div className="inline-flex items-center rounded-xl border border-pink-200 bg-white shadow-2xs">
                        <button
                          type="button"
                          onClick={() => handleUpdateQty(pId, -1)}
                          className="px-2.5 py-0.5 text-pink-700 hover:bg-pink-50 rounded-l-xl font-bold"
                        >
                          -
                        </button>
                        <span className="px-2 font-extrabold text-[#2D1B2D]">{qty}</span>
                        <button
                          type="button"
                          onClick={() => handleUpdateQty(pId, 1)}
                          className="px-2.5 py-0.5 text-pink-700 hover:bg-pink-50 rounded-r-xl font-bold"
                        >
                          +
                        </button>
                      </div>
                      <span className="w-20 text-right font-bold text-pink-900">
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
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-[#7A6273] mb-0">Pelanggan</label>
              <button
                type="button"
                onClick={() => setIsAddingCustomer(!isAddingCustomer)}
                className="text-[11px] font-bold text-pink-600 hover:text-pink-700 transition-colors"
              >
                {isAddingCustomer ? "← Pilih dari daftar" : "✨ + Pelanggan baru"}
              </button>
            </div>

            {isAddingCustomer ? (
              <input
                type="text"
                placeholder="Nama pelanggan baru (contoh: Kak Dina Puskesmas)..."
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-[#7A6273]">Sumber Pesanan</label>
              <select
                value={source}
                onChange={(e) => setSource(e.target.value as "langsung" | "wa" | "puskesmas")}
              >
                <option value="langsung">🎀 Langsung (Stand / Outlet)</option>
                <option value="wa">💬 WhatsApp (WA)</option>
                <option value="puskesmas">🏥 Puskesmas</option>
              </select>
            </div>

            <div className="flex items-center pt-2 sm:pt-6">
              <label className="flex items-center gap-2.5 cursor-pointer select-none rounded-xl border border-pink-200/80 bg-white px-3 py-2 w-full shadow-2xs hover:bg-pink-50/40">
                <input
                  type="checkbox"
                  checked={isPaid}
                  onChange={(e) => setIsPaid(e.target.checked)}
                  className="h-4 w-4 rounded-md border-pink-300 text-pink-600 focus:ring-pink-400"
                />
                <span className="text-xs font-bold text-[#2D1B2D]">
                  💖 Langsung Lunas (Tunai)
                </span>
              </label>
            </div>
          </div>

          {/* Total & Action Buttons */}
          <div className="border-t border-pink-100 pt-4 flex items-center justify-between">
            <div>
              <span className="block text-[11px] font-bold uppercase tracking-wider text-[#7A6273]">
                Total Pembayaran
              </span>
              <span className="text-2xl font-black text-rose-600">
                {formatRp(total)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleClose}
                disabled={isSubmitting}
                className="rounded-full border border-pink-200 bg-white px-4 py-2 text-xs font-bold text-[#7A6273] hover:bg-pink-50 transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSubmitting || total === 0}
                className="rounded-full bg-gradient-to-r from-pink-500 to-rose-500 px-5 py-2 text-xs font-bold text-white shadow-md shadow-pink-200 hover:from-pink-600 hover:to-rose-600 active:scale-95 disabled:opacity-50 transition-all"
              >
                {isSubmitting ? "Menyimpan..." : "✨ Simpan Pesanan"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
