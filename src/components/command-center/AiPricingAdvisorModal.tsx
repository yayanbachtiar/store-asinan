"use client";

import { useState } from "react";
import { formatRp, formatRupiahInput, parseRupiahInput } from "@/lib/format";
import {
  calculatePricingOptions,
  type PricingAnalysis,
} from "@/lib/financial-advisor";

export interface AiPricingAdvisorModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialExpenses: number;
  initialTargetCups?: number;
}

export function AiPricingAdvisorModal({
  isOpen,
  onClose,
  initialExpenses,
  initialTargetCups = 20,
}: AiPricingAdvisorModalProps) {
  const [expenseStr, setExpenseStr] = useState(
    initialExpenses > 0 ? formatRupiahInput(initialExpenses) : "Rp 150.000"
  );
  const [targetCups, setTargetCups] = useState(initialTargetCups > 0 ? initialTargetCups : 20);
  const [laborHours, setLaborHours] = useState(2.5);
  const [hourlyRateStr, setHourlyRateStr] = useState("Rp 15.000");
  const [packagingStr, setPackagingStr] = useState("Rp 1.500");

  if (!isOpen) return null;

  const totalBatchExpenses = parseRupiahInput(expenseStr);
  const hourlyRate = parseRupiahInput(hourlyRateStr);
  const packagingCostPerCup = parseRupiahInput(packagingStr);

  const analysis: PricingAnalysis = calculatePricingOptions({
    totalBatchExpenses,
    targetCups,
    laborHours,
    hourlyRate,
    packagingCostPerCup,
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#2D1B2D]/40 p-3 sm:p-4 backdrop-blur-xs">
      <div className="relative w-full max-w-2xl rounded-3xl bg-[#FFFDF9] border border-pink-200 p-5 sm:p-6 shadow-2xl max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-pink-100 pb-3.5">
          <div className="flex items-center gap-2.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-pink-100 to-purple-100 text-xl shadow-2xs">
              💡
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-[#2D1B2D]">
                  Kalkulator Harga &amp; Effort Asinan
                </h3>
                <span className="rounded-full bg-pink-100 px-2 py-0.2 text-[10px] font-bold text-pink-700">
                  AI Advisor
                </span>
              </div>
              <p className="text-xs text-[#7A6273]">
                Rekomendasi harga jual per cup berbasis HPP riil, biaya kemasan, dan kompensasi lelah
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-pink-400 hover:bg-pink-100/60 hover:text-pink-600 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Inputs Grid */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {/* Total Belanja Bahan */}
          <div>
            <label className="text-xs font-bold text-[#7A6273]">
              🛒 Total Belanja Bahan Batch
            </label>
            <input
              type="text"
              value={expenseStr}
              onChange={(e) => setExpenseStr(formatRupiahInput(e.target.value))}
              className="text-xs font-semibold"
            />
          </div>

          {/* Target Porsi / Cup */}
          <div>
            <label className="text-xs font-bold text-[#7A6273]">
              🍧 Target Porsi / Cup
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setTargetCups((c) => Math.max(5, c - 5))}
                className="rounded-xl border border-pink-200 bg-white px-3 py-2 text-xs font-bold text-pink-700 hover:bg-pink-50"
              >
                -5
              </button>
              <input
                type="number"
                min={1}
                value={targetCups}
                onChange={(e) => setTargetCups(Math.max(1, parseInt(e.target.value) || 1))}
                className="text-center text-xs font-bold"
              />
              <button
                type="button"
                onClick={() => setTargetCups((c) => c + 5)}
                className="rounded-xl border border-pink-200 bg-white px-3 py-2 text-xs font-bold text-pink-700 hover:bg-pink-50"
              >
                +5
              </button>
            </div>
          </div>

          {/* Effort: Jam Kerja */}
          <div>
            <label className="text-xs font-bold text-[#7A6273]">
              ⏱️ Waktu Produksi (Jam Kerja)
            </label>
            <input
              type="number"
              step="0.5"
              min="0"
              value={laborHours}
              onChange={(e) => setLaborHours(Math.max(0, parseFloat(e.target.value) || 0))}
              className="text-xs font-semibold"
            />
          </div>

          {/* Biaya Tenaga per Jam */}
          <div>
            <label className="text-xs font-bold text-[#7A6273]">
              💪 Nilai Upah / Jam Kerja
            </label>
            <input
              type="text"
              value={hourlyRateStr}
              onChange={(e) => setHourlyRateStr(formatRupiahInput(e.target.value))}
              className="text-xs font-semibold"
            />
          </div>

          {/* Biaya Kemasan per Cup */}
          <div className="sm:col-span-2">
            <label className="text-xs font-bold text-[#7A6273]">
              📦 Biaya Kemasan per Cup (Cup, Tutup, Sendok, Plastik, Stiker)
            </label>
            <input
              type="text"
              value={packagingStr}
              onChange={(e) => setPackagingStr(formatRupiahInput(e.target.value))}
              className="text-xs font-semibold"
            />
          </div>
        </div>

        {/* Breakdown HPP Bar */}
        <div className="mt-4 rounded-2xl border border-pink-200/80 bg-white p-4 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-[#7A6273]">
            <span>Struktur HPP per Cup</span>
            <span className="text-pink-600 font-extrabold text-sm">
              Total HPP: {formatRp(analysis.totalHppPerCup)}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2 pt-1 text-center">
            <div className="rounded-xl bg-pink-50/80 p-2 border border-pink-100">
              <span className="block text-[10px] text-[#7A6273]">Bahan Baku</span>
              <span className="text-xs font-bold text-pink-900">
                {formatRp(analysis.ingredientHppPerCup)}
              </span>
            </div>
            <div className="rounded-xl bg-purple-50/80 p-2 border border-purple-100">
              <span className="block text-[10px] text-purple-700">Tenaga &amp; Waktu</span>
              <span className="text-xs font-bold text-purple-900">
                {formatRp(analysis.laborCostPerCup)}
              </span>
            </div>
            <div className="rounded-xl bg-amber-50/80 p-2 border border-amber-100">
              <span className="block text-[10px] text-amber-700">Kemasan &amp; Stiker</span>
              <span className="text-xs font-bold text-amber-900">
                {formatRp(analysis.packagingCostPerCup)}
              </span>
            </div>
          </div>
        </div>

        {/* 3 Tiers Recommendation Cards */}
        <div className="mt-4 space-y-2.5">
          <span className="block text-xs font-extrabold text-[#7A6273] uppercase tracking-wider">
            ✨ Rekomendasi Harga Jual Mochi
          </span>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Friendly */}
            <div className="rounded-2xl border border-pink-100 bg-white p-3.5 shadow-xs flex flex-col justify-between hover:border-pink-300 transition-all">
              <div>
                <span className="text-xs font-bold text-[#7A6273]">
                  {analysis.tiers.friendly.name}
                </span>
                <p className="mt-1 text-xl font-extrabold text-[#2D1B2D]">
                  {formatRp(analysis.tiers.friendly.price)}
                </p>
                <p className="mt-1 text-[11px] text-emerald-700 font-semibold">
                  + {formatRp(analysis.tiers.friendly.profitPerCup)} / cup
                </p>
                <p className="mt-2 text-[10px] text-[#7A6273] leading-relaxed">
                  {analysis.tiers.friendly.recommendationNote}
                </p>
              </div>
              <div className="mt-3 pt-2 border-t border-pink-50 text-[11px] text-[#7A6273]">
                Estimasi Laba Batch:{" "}
                <strong className="text-emerald-700">
                  {formatRp(analysis.tiers.friendly.totalEstimatedProfit)}
                </strong>
              </div>
            </div>

            {/* Ideal (Highlighted) */}
            <div className="relative rounded-2xl border-2 border-pink-400 bg-gradient-to-b from-pink-50/80 to-white p-3.5 shadow-md shadow-pink-100 flex flex-col justify-between transform md:-translate-y-1">
              <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 px-3 py-0.5 text-[9px] font-extrabold text-white tracking-wider uppercase shadow-2xs">
                💖 Paling Ideal
              </div>
              <div>
                <span className="text-xs font-bold text-pink-800">
                  {analysis.tiers.ideal.name}
                </span>
                <p className="mt-1 text-2xl font-black text-rose-600">
                  {formatRp(analysis.tiers.ideal.price)}
                </p>
                <p className="mt-1 text-[11px] text-emerald-700 font-bold">
                  + {formatRp(analysis.tiers.ideal.profitPerCup)} / cup
                </p>
                <p className="mt-2 text-[10px] text-[#7A6273] leading-relaxed">
                  {analysis.tiers.ideal.recommendationNote}
                </p>
              </div>
              <div className="mt-3 pt-2 border-t border-pink-200/60 text-[11px] text-pink-900 font-medium">
                Estimasi Laba Batch:{" "}
                <strong className="text-emerald-700 font-bold">
                  {formatRp(analysis.tiers.ideal.totalEstimatedProfit)}
                </strong>
              </div>
            </div>

            {/* Premium */}
            <div className="rounded-2xl border border-purple-100 bg-white p-3.5 shadow-xs flex flex-col justify-between hover:border-purple-300 transition-all">
              <div>
                <span className="text-xs font-bold text-purple-800">
                  {analysis.tiers.premium.name}
                </span>
                <p className="mt-1 text-xl font-extrabold text-[#2D1B2D]">
                  {formatRp(analysis.tiers.premium.price)}
                </p>
                <p className="mt-1 text-[11px] text-emerald-700 font-semibold">
                  + {formatRp(analysis.tiers.premium.profitPerCup)} / cup
                </p>
                <p className="mt-2 text-[10px] text-[#7A6273] leading-relaxed">
                  {analysis.tiers.premium.recommendationNote}
                </p>
              </div>
              <div className="mt-3 pt-2 border-t border-purple-50 text-[11px] text-[#7A6273]">
                Estimasi Laba Batch:{" "}
                <strong className="text-emerald-700">
                  {formatRp(analysis.tiers.premium.totalEstimatedProfit)}
                </strong>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="mt-5 border-t border-pink-100 pt-3 flex items-center justify-between">
          <p className="text-[11px] text-[#7A6273]">
            💡 Seluruh rekomendasi harga dibulatkan otomatis ke kelipatan Rp 500 terdekat.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-gradient-to-r from-pink-500 to-rose-500 px-5 py-2 text-xs font-bold text-white shadow-xs hover:from-pink-600 hover:to-rose-600 active:scale-95 transition-all"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
