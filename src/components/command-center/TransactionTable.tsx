"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatRp } from "@/lib/format";
import type { Expense, Order, Payment } from "@/lib/types";

export type OrderRow = Order & {
  customerName: string;
  total: number;
  payment: Payment | null;
};

export type ExpenseRow = Expense & {
  paidByName: string;
};

export interface TransactionTableProps {
  orders: OrderRow[];
  expenses: ExpenseRow[];
  currentMemberId: string;
}

function formatTime(isoStr: string): string {
  try {
    const d = new Date(isoStr);
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "—";
  }
}

function formatDate(isoStr: string): string {
  try {
    const d = new Date(isoStr);
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
  } catch {
    return "—";
  }
}

export function TransactionTable({
  orders,
  expenses,
  currentMemberId,
}: TransactionTableProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"orders" | "expenses">("orders");
  const [orderFilter, setOrderFilter] = useState<"semua" | "lunas" | "tempo">("semua");
  const [searchQuery, setSearchQuery] = useState("");
  const [busyOrderId, setBusyOrderId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const lunasCount = orders.filter((o) => o.paymentStatus === "sudah").length;
  const tempoCount = orders.filter((o) => o.paymentStatus === "belum").length;

  const filteredOrders = orders.filter((o) => {
    if (orderFilter === "lunas" && o.paymentStatus !== "sudah") return false;
    if (orderFilter === "tempo" && o.paymentStatus !== "belum") return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchCust = o.customerName.toLowerCase().includes(q);
      const matchItem = o.items.some((i) => i.productNameSnapshot.toLowerCase().includes(q));
      if (!matchCust && !matchItem) return false;
    }
    return true;
  });

  const filteredExpenses = expenses.filter((e) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        e.description.toLowerCase().includes(q) ||
        e.paidByName.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleQuickPay = async (order: OrderRow) => {
    setActionError(null);
    setBusyOrderId(order.id);
    try {
      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: order.id,
          amount: order.total,
          method: "cash",
          receivedBy: currentMemberId,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Gagal melunasi order");
      }
      router.refresh();
    } catch (e: unknown) {
      setActionError(e instanceof Error ? e.message : "Terjadi kesalahan pelunasan");
    } finally {
      setBusyOrderId(null);
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    if (!confirm("Hapus catatan pesanan ini?")) return;
    setActionError(null);
    try {
      const res = await fetch(`/api/orders/${orderId}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Gagal menghapus order");
      }
      router.refresh();
    } catch (e: unknown) {
      setActionError(e instanceof Error ? e.message : "Gagal menghapus order");
    }
  };

  const handleDeleteExpense = async (expenseId: string) => {
    if (!confirm("Hapus catatan belanja ini?")) return;
    setActionError(null);
    try {
      const res = await fetch(`/api/expenses/${expenseId}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Gagal menghapus pengeluaran");
      }
      router.refresh();
    } catch (e: unknown) {
      setActionError(e instanceof Error ? e.message : "Gagal menghapus pengeluaran");
    }
  };

  return (
    <div className="rounded-3xl border border-pink-200/80 bg-white shadow-xs overflow-hidden">
      {/* Top Bar: Tabs & Search */}
      <div className="border-b border-pink-100/80 bg-[#FFFDF9] p-3 sm:px-5 sm:py-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        {/* Main Tabs (Pill Capsule) */}
        <div className="flex items-center gap-1.5 p-1 bg-pink-100/60 rounded-full w-fit">
          <button
            type="button"
            onClick={() => setActiveTab("orders")}
            className={`rounded-full px-4 py-1.5 text-xs font-bold transition-all ${
              activeTab === "orders"
                ? "bg-white text-rose-600 shadow-xs"
                : "text-[#7A6273] hover:text-[#2D1B2D]"
            }`}
          >
            🌸 Penjualan ({orders.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("expenses")}
            className={`rounded-full px-4 py-1.5 text-xs font-bold transition-all ${
              activeTab === "expenses"
                ? "bg-white text-rose-600 shadow-xs"
                : "text-[#7A6273] hover:text-[#2D1B2D]"
            }`}
          >
            🧺 Belanja Bahan ({expenses.length})
          </button>
        </div>

        {/* Search */}
        <div className="w-full sm:w-64">
          <input
            type="text"
            placeholder={activeTab === "orders" ? "🔍 Cari pelanggan / produk..." : "🔍 Cari belanja / nama..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="rounded-full border border-pink-200/80 bg-white px-3.5 py-1.5 text-xs text-[#2D1B2D] placeholder-[#A892A2] focus:border-pink-400 focus:outline-none"
          />
        </div>
      </div>

      {actionError && (
        <div className="border-b border-rose-200 bg-rose-50 px-4 py-2.5 text-xs text-rose-800 flex justify-between items-center">
          <span>{actionError}</span>
          <button
            type="button"
            onClick={() => setActionError(null)}
            className="text-rose-500 hover:text-rose-800 font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Orders View */}
      {activeTab === "orders" && (
        <div>
          {/* Sub Filters */}
          <div className="flex items-center gap-2 border-b border-pink-100/60 px-4 py-2 bg-white text-xs">
            <span className="text-[#7A6273] text-[11px] font-semibold mr-1">Filter:</span>
            <button
              type="button"
              onClick={() => setOrderFilter("semua")}
              className={`rounded-full px-3 py-1 text-[11px] font-bold transition-all ${
                orderFilter === "semua"
                  ? "bg-[#2D1B2D] text-white shadow-2xs"
                  : "bg-pink-50 text-[#7A6273] hover:bg-pink-100/70"
              }`}
            >
              Semua ({orders.length})
            </button>
            <button
              type="button"
              onClick={() => setOrderFilter("lunas")}
              className={`rounded-full px-3 py-1 text-[11px] font-bold transition-all ${
                orderFilter === "lunas"
                  ? "bg-emerald-600 text-white shadow-2xs"
                  : "bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
              }`}
            >
              💖 Lunas ({lunasCount})
            </button>
            <button
              type="button"
              onClick={() => setOrderFilter("tempo")}
              className={`rounded-full px-3 py-1 text-[11px] font-bold transition-all ${
                orderFilter === "tempo"
                  ? "bg-amber-600 text-white shadow-2xs"
                  : "bg-amber-50 text-amber-800 hover:bg-amber-100"
              }`}
            >
              ⏳ Belum Bayar / Tempo ({tempoCount})
            </button>
          </div>

          {filteredOrders.length === 0 ? (
            <div className="p-10 text-center text-xs text-[#7A6273] space-y-2">
              <span className="text-3xl block">🍧</span>
              <p className="font-semibold text-[#2D1B2D]">
                Belum ada data penjualan yang cocok
              </p>
              <p className="text-[11px] text-[#A892A2]">
                Yuk catat pesanan baru dengan tombol &apos;+ Catat Penjualan&apos; di atas 🌸
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-pink-100 bg-[#FFFDF9] text-[11px] font-bold uppercase tracking-wider text-[#7A6273]">
                    <th className="py-3 pl-4 pr-2">Waktu</th>
                    <th className="py-3 px-3">Pelanggan &amp; Item</th>
                    <th className="py-3 px-3 text-right">Cup</th>
                    <th className="py-3 px-3 text-right">Total</th>
                    <th className="py-3 px-3 text-center">Status</th>
                    <th className="py-3 pl-3 pr-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-pink-100/70">
                  {filteredOrders.map((o) => {
                    const cupCount = o.items.reduce((sum, item) => sum + item.qty, 0);
                    const isPaid = o.paymentStatus === "sudah";
                    const isBusy = busyOrderId === o.id;

                    const sourceBadge =
                      o.source === "wa"
                        ? { bg: "bg-emerald-100 text-emerald-800", icon: "💬", label: "WA" }
                        : o.source === "puskesmas"
                        ? { bg: "bg-blue-100 text-blue-800", icon: "🏥", label: "Puskesmas" }
                        : { bg: "bg-pink-100 text-pink-800", icon: "🛍️", label: "Stand" };

                    return (
                      <tr
                        key={o.id}
                        className="even:bg-pink-50/20 hover:bg-pink-50/60 transition-colors"
                      >
                        {/* Waktu */}
                        <td className="py-3 pl-4 pr-2 align-middle whitespace-nowrap text-[#7A6273]">
                          <span className="font-bold text-[#2D1B2D]">{formatTime(o.createdAt)}</span>
                          <span className="block text-[10px] text-[#A892A2]">{formatDate(o.createdAt)}</span>
                        </td>

                        {/* Pelanggan & Items */}
                        <td className="py-3 px-3 align-middle">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-extrabold text-[#2D1B2D]">{o.customerName}</span>
                            <span
                              className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider inline-flex items-center gap-1 ${sourceBadge.bg}`}
                            >
                              <span>{sourceBadge.icon}</span>
                              <span>{sourceBadge.label}</span>
                            </span>
                          </div>
                          <p className="text-[11px] text-[#7A6273] mt-0.5">
                            {o.items.map((i) => `${i.qty}× ${i.productNameSnapshot}`).join(", ")}
                          </p>
                        </td>

                        {/* Qty Cup */}
                        <td className="py-3 px-3 align-middle text-right whitespace-nowrap font-bold text-[#7A6273]">
                          <span className="rounded-full bg-pink-100/70 px-2 py-0.5 text-[11px] font-bold text-pink-900">
                            {cupCount} cup
                          </span>
                        </td>

                        {/* Total Nominal */}
                        <td className="py-3 px-3 align-middle text-right whitespace-nowrap font-black text-[#2D1B2D]">
                          {formatRp(o.total)}
                        </td>

                        {/* Status */}
                        <td className="py-3 px-3 align-middle text-center whitespace-nowrap">
                          {isPaid ? (
                            <span className="inline-flex items-center rounded-full bg-emerald-100/80 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800 border border-emerald-200/60 shadow-2xs">
                              💖 Lunas
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-full bg-amber-100/80 px-2.5 py-0.5 text-[10px] font-bold text-amber-800 border border-amber-200/60 shadow-2xs">
                              ⏳ Belum Bayar
                            </span>
                          )}
                        </td>

                        {/* Aksi */}
                        <td className="py-3 pl-3 pr-4 align-middle text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-2">
                            {!isPaid && (
                              <button
                                type="button"
                                disabled={isBusy}
                                onClick={() => handleQuickPay(o)}
                                className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 px-3 py-1 text-[11px] font-bold text-white shadow-xs hover:from-pink-600 hover:to-rose-600 disabled:opacity-50 active:scale-95 transition-all"
                              >
                                {isBusy ? "..." : "✨ Lunasi"}
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleDeleteOrder(o.id)}
                              className="text-[11px] text-[#A892A2] hover:text-rose-600 transition-colors p-1"
                              title="Hapus order"
                            >
                              Hapus
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Expenses View */}
      {activeTab === "expenses" && (
        <div>
          {filteredExpenses.length === 0 ? (
            <div className="p-10 text-center text-xs text-[#7A6273] space-y-2">
              <span className="text-3xl block">🧺</span>
              <p className="font-semibold text-[#2D1B2D]">
                Belum ada data belanja bahan pada batch ini
              </p>
              <p className="text-[11px] text-[#A892A2]">
                Klik &apos;- Belanja Bahan&apos; untuk mulai mencatat pengeluaran modal batch 🌸
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-pink-100 bg-[#FFFDF9] text-[11px] font-bold uppercase tracking-wider text-[#7A6273]">
                    <th className="py-3 pl-4 pr-2">Waktu</th>
                    <th className="py-3 px-3">Keterangan Belanja Bahan</th>
                    <th className="py-3 px-3">Ditalangi Oleh</th>
                    <th className="py-3 px-3 text-right">Nominal</th>
                    <th className="py-3 pl-3 pr-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-pink-100/70">
                  {filteredExpenses.map((e) => (
                    <tr
                      key={e.id}
                      className="even:bg-pink-50/20 hover:bg-pink-50/60 transition-colors"
                    >
                      {/* Waktu */}
                      <td className="py-3 pl-4 pr-2 align-middle whitespace-nowrap text-[#7A6273]">
                        <span className="font-bold text-[#2D1B2D]">{formatTime(e.createdAt)}</span>
                        <span className="block text-[10px] text-[#A892A2]">{formatDate(e.createdAt)}</span>
                      </td>

                      {/* Keterangan */}
                      <td className="py-3 px-3 align-middle font-bold text-[#2D1B2D]">
                        {e.description}
                      </td>

                      {/* Ditalangi Oleh */}
                      <td className="py-3 px-3 align-middle text-[#7A6273]">
                        <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-2 py-0.5 text-[11px] font-semibold text-purple-700 border border-purple-200/50">
                          🌸 {e.paidByName}
                        </span>
                      </td>

                      {/* Nominal */}
                      <td className="py-3 px-3 align-middle text-right whitespace-nowrap font-black text-rose-600">
                        {formatRp(e.amount)}
                      </td>

                      {/* Aksi */}
                      <td className="py-3 pl-3 pr-4 align-middle text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleDeleteExpense(e.id)}
                          className="text-[11px] text-[#A892A2] hover:text-rose-600 transition-colors p-1"
                          title="Hapus belanja"
                        >
                          Hapus
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
