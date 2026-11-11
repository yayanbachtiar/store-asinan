"use client";

import { useState } from "react";
import Link from "next/link";
import {
  QuickOrderModal,
  type CustomerOpt,
  type ProductOpt,
} from "./QuickOrderModal";
import {
  QuickExpenseModal,
  type MemberOpt,
} from "./QuickExpenseModal";
import {
  TransactionTable,
  type ExpenseRow,
  type OrderRow,
} from "./TransactionTable";

export interface CommandCenterViewProps {
  batchId: string;
  batchTitle: string;
  batchStatus: "aktif" | "ditutup";
  products: ProductOpt[];
  customers: CustomerOpt[];
  members: MemberOpt[];
  currentMemberId: string;
  orders: OrderRow[];
  expenses: ExpenseRow[];
}

export function CommandCenterView({
  batchId,
  batchTitle,
  batchStatus,
  products,
  customers,
  members,
  currentMemberId,
  orders,
  expenses,
}: CommandCenterViewProps) {
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);

  return (
    <div className="space-y-6">
      {/* Zona 2: Quick Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-emerald-200/80 bg-gradient-to-r from-emerald-50/70 via-white to-slate-50 p-4 shadow-xs">
        <div className="flex items-center gap-2.5">
          <span className="flex h-3 w-3 relative">
            {batchStatus === "aktif" && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            )}
            <span
              className={`relative inline-flex rounded-full h-3 w-3 ${
                batchStatus === "aktif" ? "bg-emerald-500" : "bg-slate-400"
              }`}
            ></span>
          </span>
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span>{batchTitle}</span>
              <span
                className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full ${
                  batchStatus === "aktif"
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-slate-200 text-slate-700"
                }`}
              >
                {batchStatus === "aktif" ? "Batch Aktif" : "Ditutup"}
              </span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Input cepat penjualan harian &amp; belanja bahan langsung ke pembukuan
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {batchStatus === "aktif" && (
            <>
              <button
                type="button"
                onClick={() => setIsOrderModalOpen(true)}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 active:scale-98 transition-all"
              >
                <span className="text-sm leading-none font-extrabold">+</span>
                <span>Catat Penjualan</span>
              </button>
              <button
                type="button"
                onClick={() => setIsExpenseModalOpen(true)}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 hover:border-slate-400 active:scale-98 transition-all"
              >
                <span className="text-sm leading-none font-extrabold">-</span>
                <span>Belanja Bahan</span>
              </button>
            </>
          )}
          <Link
            href={`/batch/${batchId}`}
            className="rounded-xl border border-slate-200 bg-white/80 px-3 py-2.5 text-xs font-medium text-slate-600 hover:text-emerald-700 hover:border-emerald-200 transition-colors hidden md:inline-block"
            title="Lihat detail lengkap rekonsiliasi dan alokasi batch"
          >
            Rincian &rarr;
          </Link>
        </div>
      </div>

      {/* Zona 3: Data-dense Transaction Table */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Aktivitas Transaksi Batch Ini
          </h3>
          <span className="text-xs text-slate-400">
            {orders.length} penjualan · {expenses.length} pengeluaran
          </span>
        </div>
        <TransactionTable
          orders={orders}
          expenses={expenses}
          currentMemberId={currentMemberId}
        />
      </div>

      {/* Modals */}
      <QuickOrderModal
        batchId={batchId}
        products={products}
        customers={customers}
        currentMemberId={currentMemberId}
        isOpen={isOrderModalOpen}
        onClose={() => setIsOrderModalOpen(false)}
      />

      <QuickExpenseModal
        batchId={batchId}
        members={members}
        currentMemberId={currentMemberId}
        isOpen={isExpenseModalOpen}
        onClose={() => setIsExpenseModalOpen(false)}
      />
    </div>
  );
}
