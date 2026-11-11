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
    if (!confirm("Hapus order ini?")) return;
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
    if (!confirm("Hapus pengeluaran ini?")) return;
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
    <div className="rounded-2xl border border-slate-200/90 bg-white shadow-xs overflow-hidden">
      {/* Top Bar: Tabs & Search */}
      <div className="border-b border-slate-100 bg-slate-50/50 p-3 sm:px-5 sm:py-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        {/* Main Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-200/60 rounded-xl w-fit">
          <button
            type="button"
            onClick={() => setActiveTab("orders")}
            className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
              activeTab === "orders"
                ? "bg-white text-emerald-800 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Penjualan ({orders.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("expenses")}
            className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
              activeTab === "expenses"
                ? "bg-white text-emerald-800 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Belanja Bahan ({expenses.length})
          </button>
        </div>

        {/* Search */}
        <div className="w-full sm:w-64">
          <input
            type="text"
            placeholder={activeTab === "orders" ? "Cari pelanggan / produk..." : "Cari belanja / pembayar..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none"
          />
        </div>
      </div>

      {actionError && (
        <div className="border-b border-rose-100 bg-rose-50 px-4 py-2 text-xs text-rose-700 flex justify-between items-center">
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
          <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-2 bg-white text-xs">
            <span className="text-slate-400 text-[11px] font-medium mr-1">Filter:</span>
            <button
              type="button"
              onClick={() => setOrderFilter("semua")}
              className={`rounded-full px-2.5 py-0.8 text-[11px] font-medium transition-colors ${
                orderFilter === "semua"
                  ? "bg-slate-800 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Semua ({orders.length})
            </button>
            <button
              type="button"
              onClick={() => setOrderFilter("lunas")}
              className={`rounded-full px-2.5 py-0.8 text-[11px] font-medium transition-colors ${
                orderFilter === "lunas"
                  ? "bg-emerald-600 text-white"
                  : "bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
              }`}
            >
              Lunas ({lunasCount})
            </button>
            <button
              type="button"
              onClick={() => setOrderFilter("tempo")}
              className={`rounded-full px-2.5 py-0.8 text-[11px] font-medium transition-colors ${
                orderFilter === "tempo"
                  ? "bg-amber-600 text-white"
                  : "bg-amber-50 text-amber-800 hover:bg-amber-100"
              }`}
            >
              Belum Bayar / Tempo ({tempoCount})
            </button>
          </div>

          {filteredOrders.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">
              Tidak ada data penjualan yang cocok.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200/80 bg-slate-50/70 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    <th className="py-2.5 pl-4 pr-2">Waktu</th>
                    <th className="py-2.5 px-3">Pelanggan & Item</th>
                    <th className="py-2.5 px-3 text-right">Cup</th>
                    <th className="py-2.5 px-3 text-right">Total</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                    <th className="py-2.5 pl-3 pr-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredOrders.map((o) => {
                    const cupCount = o.items.reduce((sum, item) => sum + item.qty, 0);
                    const isPaid = o.paymentStatus === "sudah";
                    const isBusy = busyOrderId === o.id;

                    return (
                      <tr
                        key={o.id}
                        className="even:bg-slate-50/50 hover:bg-emerald-50/30 transition-colors"
                      >
                        {/* Waktu */}
                        <td className="py-2.5 pl-4 pr-2 align-middle whitespace-nowrap text-slate-500">
                          <span className="font-semibold text-slate-700">{formatTime(o.createdAt)}</span>
                          <span className="block text-[10px] text-slate-400">{formatDate(o.createdAt)}</span>
                        </td>

                        {/* Pelanggan & Items */}
                        <td className="py-2.5 px-3 align-middle">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-bold text-slate-900">{o.customerName}</span>
                            <span
                              className={`rounded px-1.5 py-0.2 text-[9px] font-semibold uppercase tracking-wider ${
                                o.source === "wa"
                                  ? "bg-green-100 text-green-800"
                                  : o.source === "puskesmas"
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-slate-100 text-slate-700"
                              }`}
                            >
                              {o.source}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            {o.items.map((i) => `${i.qty}× ${i.productNameSnapshot}`).join(", ")}
                          </p>
                        </td>

                        {/* Qty Cup */}
                        <td className="py-2.5 px-3 align-middle text-right whitespace-nowrap font-medium text-slate-700">
                          {cupCount}
                        </td>

                        {/* Total Nominal */}
                        <td className="py-2.5 px-3 align-middle text-right whitespace-nowrap font-bold text-slate-900">
                          {formatRp(o.total)}
                        </td>

                        {/* Status */}
                        <td className="py-2.5 px-3 align-middle text-center whitespace-nowrap">
                          {isPaid ? (
                            <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                              ✓ Lunas
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-800 ring-1 ring-inset ring-amber-600/20">
                              Belum Bayar
                            </span>
                          )}
                        </td>

                        {/* Aksi */}
                        <td className="py-2.5 pl-3 pr-4 align-middle text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-2">
                            {!isPaid && (
                              <button
                                type="button"
                                disabled={isBusy}
                                onClick={() => handleQuickPay(o)}
                                className="inline-flex items-center gap-1 rounded-md bg-emerald-600 px-2 py-1 text-[11px] font-semibold text-white shadow-2xs hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                              >
                                {isBusy ? "..." : "⚡ Lunasi"}
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleDeleteOrder(o.id)}
                              className="text-[11px] text-slate-400 hover:text-rose-600 transition-colors"
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
            <div className="p-8 text-center text-xs text-slate-500">
              Belum ada data belanja bahan pada batch ini.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200/80 bg-slate-50/70 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    <th className="py-2.5 pl-4 pr-2">Waktu</th>
                    <th className="py-2.5 px-3">Keterangan Belanja</th>
                    <th className="py-2.5 px-3">Ditalangi Oleh</th>
                    <th className="py-2.5 px-3 text-right">Nominal</th>
                    <th className="py-2.5 pl-3 pr-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredExpenses.map((e) => (
                    <tr
                      key={e.id}
                      className="even:bg-slate-50/50 hover:bg-emerald-50/30 transition-colors"
                    >
                      {/* Waktu */}
                      <td className="py-2.5 pl-4 pr-2 align-middle whitespace-nowrap text-slate-500">
                        <span className="font-semibold text-slate-700">{formatTime(e.createdAt)}</span>
                        <span className="block text-[10px] text-slate-400">{formatDate(e.createdAt)}</span>
                      </td>

                      {/* Keterangan */}
                      <td className="py-2.5 px-3 align-middle font-medium text-slate-900">
                        {e.description}
                      </td>

                      {/* Ditalangi Oleh */}
                      <td className="py-2.5 px-3 align-middle text-slate-600">
                        {e.paidByName}
                      </td>

                      {/* Nominal */}
                      <td className="py-2.5 px-3 align-middle text-right whitespace-nowrap font-bold text-slate-900">
                        {formatRp(e.amount)}
                      </td>

                      {/* Aksi */}
                      <td className="py-2.5 pl-3 pr-4 align-middle text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleDeleteExpense(e.id)}
                          className="text-[11px] text-slate-400 hover:text-rose-600 transition-colors"
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
