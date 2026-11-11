"use client";

import { useState } from "react";
import { formatRp } from "@/lib/format";
import {
  calculateBatchBreakEven,
  generateProactiveAdvice,
  type ProactiveAdvice,
} from "@/lib/financial-advisor";
import { CuteBananaMascot } from "@/components/CuteBananaMascot";

export interface AiAdvisorBannerProps {
  totalExpenses: number;
  cupsSold: number;
  totalRevenue: number;
  currentProfit: number;
  unpaidCount: number;
  onOpenPricingAdvisor: () => void;
}

export function AiAdvisorBanner({
  totalExpenses,
  cupsSold,
  totalRevenue,
  currentProfit,
  unpaidCount,
  onOpenPricingAdvisor,
}: AiAdvisorBannerProps) {
  const [isDismissed, setIsDismissed] = useState(false);

  const advice: ProactiveAdvice = generateProactiveAdvice({
    totalExpenses,
    cupsSold,
    totalRevenue,
    currentProfit,
    unpaidCount,
  });

  const avgPrice = cupsSold > 0 ? Math.round(totalRevenue / cupsSold) : 15000;
  const bep = calculateBatchBreakEven({
    totalExpenses,
    avgPricePerCup: avgPrice,
    cupsSold,
  });

  if (isDismissed) return null;

  return (
    <div className="relative overflow-hidden rounded-3xl border border-pink-200/80 bg-gradient-to-r from-pink-50/90 via-purple-50/60 to-amber-50/50 p-4 sm:p-5 shadow-xs transition-all">
      {/* Decorative background element */}
      <div className="pointer-events-none absolute -right-6 -top-6 h-28 w-28 rounded-full bg-pink-200/30 blur-2xl"></div>

      <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left: Avatar Mascot + Message */}
        <div className="flex items-start gap-3.5">
          <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white shadow-xs border border-pink-100/90 overflow-visible">
            <CuteBananaMascot variant="advisor" size={54} />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-pink-100 text-pink-800 border border-pink-200/60">
                🍌 Nana • AI Advisor
              </span>
              <h3 className="text-sm font-bold text-[#2D1B2D]">
                {advice.headline}
              </h3>
            </div>
            <p className="text-xs text-[#7A6273] leading-relaxed max-w-2xl">
              {advice.message}
            </p>

            {/* Break-Even Progress bar if expenses exist and not fully reached */}
            {totalExpenses > 0 && bep.bepCups > 0 && (
              <div className="pt-2 pb-1 max-w-md">
                <div className="flex items-center justify-between text-[11px] font-semibold text-[#7A6273] mb-1">
                  <span>Balik Modal (BEP: {bep.bepCups} cup)</span>
                  <span className="text-pink-600 font-bold">{bep.progressPct}%</span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/80 p-0.5 border border-pink-200/70">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-pink-400 via-rose-400 to-purple-400 transition-all duration-500"
                    style={{ width: `${bep.progressPct}%` }}
                  ></div>
                </div>
              </div>
            )}

            {advice.tip && (
              <p className="text-[11px] font-medium text-pink-700/90 pt-0.5">
                {advice.tip}
              </p>
            )}
          </div>
        </div>

        {/* Right: Quick Action Pill */}
        <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
          <button
            type="button"
            onClick={onOpenPricingAdvisor}
            className="inline-flex items-center gap-1.5 rounded-full bg-white border border-pink-200/90 px-3.5 py-2 text-xs font-bold text-pink-700 shadow-2xs hover:bg-pink-50 hover:border-pink-300 hover:scale-102 active:scale-95 transition-all"
          >
            <span>💡</span>
            <span>Rekomendasi Harga</span>
          </button>
          <button
            type="button"
            onClick={() => setIsDismissed(true)}
            className="rounded-full p-1.5 text-pink-400 hover:bg-white/80 hover:text-pink-600 transition-colors"
            title="Tutup saran"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}
