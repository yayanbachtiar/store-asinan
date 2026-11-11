"use client";

import { useState } from "react";
import Link from "next/link";
import { AiAdvisorBanner } from "./AiAdvisorBanner";
import { AiPricingAdvisorModal } from "./AiPricingAdvisorModal";
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
  const [isPricingAdvisorOpen, setIsPricingAdvisorOpen] = useState(false);

  const totalCups = orders
    .flatMap((o) => o.items)
    .reduce((sum, item) => sum + item.qty, 0);
  const totalRevenue = orders
    .filter((o) => o.paymentStatus === "sudah")
    .reduce((sum, o) => sum + o.total, 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const unpaidCount = orders.filter((o) => o.paymentStatus === "belum").length;
  const currentProfit = totalRevenue - totalExpenses;

  return (
    <div className="space-y-6">
      {/* Zona AI: Proactive Financial Advisor Banner */}
      <AiAdvisorBanner
        totalExpenses={totalExpenses}
        cupsSold={totalCups}
        totalRevenue={totalRevenue}
        currentProfit={currentProfit}
        unpaidCount={unpaidCount}
        onOpenPricingAdvisor={() => setIsPricingAdvisorOpen(true)}
      />

      {/* Zona 2: Quick Action Bar (Sakura Pink & Cream Minimalist) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-3xl border border-pink-200/90 bg-gradient-to-r from-pink-50/80 via-white to-amber-50/40 p-4 sm:p-5 shadow-xs">
        <div className="flex items-center gap-3">
          <span className="flex h-3.5 w-3.5 relative">
            {batchStatus === "aktif" && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75"></span>
            )}
            <span
              className={`relative inline-flex rounded-full h-3.5 w-3.5 ${
                batchStatus === "aktif" ? "bg-rose-500" : "bg-slate-400"
              }`}
            ></span>
          </span>
          <div>
            <h2 className="text-sm font-black text-[#2D1B2D] flex items-center gap-2">
              <span>{batchTitle}</span>
              <span
                className={`text-[10px] uppercase tracking-wider font-extrabold px-2.5 py-0.5 rounded-full ${
                  batchStatus === "aktif"
                    ? "bg-pink-100 text-pink-700 border border-pink-200"
                    : "bg-slate-200 text-slate-700"
                }`}
              >
                {batchStatus === "aktif" ? "🌸 Batch Aktif" : "Ditutup"}
              </span>
            </h2>
            <p className="text-xs text-[#7A6273] mt-0.5">
              Input cepat penjualan harian &amp; belanja modal bahan asinan
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {batchStatus === "aktif" && (
            <>
              <button
                type="button"
                onClick={() => setIsOrderModalOpen(true)}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 px-4 py-2.5 text-xs font-black text-white shadow-sm shadow-pink-200 hover:from-pink-600 hover:to-rose-600 active:scale-95 transition-all"
              >
                <span className="text-sm leading-none font-extrabold">✨ +</span>
                <span>Catat Penjualan</span>
              </button>
              <button
                type="button"
                onClick={() => setIsExpenseModalOpen(true)}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 rounded-full border-2 border-pink-200 bg-white px-3.5 py-2.5 text-xs font-bold text-pink-700 shadow-2xs hover:bg-pink-50 active:scale-95 transition-all"
              >
                <span className="text-sm leading-none font-extrabold">🧺 -</span>
                <span>Belanja Bahan</span>
              </button>
            </>
          )}
          <button
            type="button"
            onClick={() => setIsPricingAdvisorOpen(true)}
            className="rounded-full border border-purple-200 bg-purple-50/80 px-3 py-2 text-xs font-bold text-purple-700 hover:bg-purple-100 active:scale-95 transition-all"
            title="Kalkulator harga dan effort"
          >
            💡 Advisor
          </button>
          <Link
            href={`/batch/${batchId}`}
            className="rounded-full border border-pink-100 bg-white px-3.5 py-2 text-xs font-bold text-[#7A6273] hover:text-pink-700 hover:border-pink-200 transition-colors hidden md:inline-block shadow-2xs"
            title="Lihat detail lengkap alokasi dan laporan batch"
          >
            Rincian &rarr;
          </Link>
        </div>
      </div>

      {/* Zona 3: Data-dense Cute Transaction Table */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-xs font-black uppercase tracking-wider text-[#7A6273] flex items-center gap-1.5">
            <span>✨</span>
            <span>Aktivitas Transaksi Batch Ini</span>
          </h3>
          <span className="text-xs font-medium text-[#A892A2]">
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

      <AiPricingAdvisorModal
        isOpen={isPricingAdvisorOpen}
        onClose={() => setIsPricingAdvisorOpen(false)}
        initialExpenses={totalExpenses}
        initialTargetCups={totalCups > 0 ? totalCups : 20}
      />
    </div>
  );
}
