/**
 * Financial Advisor logic for Asinan Store Operations.
 * Provides cute, agentic assistance for pricing, labor effort, and break-even monitoring.
 */

export interface PricingInput {
  totalBatchExpenses: number;
  targetCups: number;
  laborHours?: number;
  hourlyRate?: number;
  packagingCostPerCup?: number;
}

export interface PricingTier {
  name: string;
  marginPct: number;
  price: number;
  profitPerCup: number;
  totalEstimatedProfit: number;
  recommendationNote: string;
}

export interface PricingAnalysis {
  ingredientHppPerCup: number;
  laborCostPerCup: number;
  packagingCostPerCup: number;
  totalHppPerCup: number;
  targetCups: number;
  tiers: {
    friendly: PricingTier;
    ideal: PricingTier;
    premium: PricingTier;
  };
}

export interface BreakEvenInput {
  totalExpenses: number;
  avgPricePerCup: number;
  cupsSold: number;
}

export interface BreakEvenResult {
  bepCups: number;
  remainingCupsToBep: number;
  isBreakEvenReached: boolean;
  progressPct: number;
  cupsSold: number;
}

export interface ProactiveAdviceInput {
  totalExpenses: number;
  cupsSold: number;
  totalRevenue: number;
  currentProfit: number;
  unpaidCount: number;
}

export interface ProactiveAdvice {
  tone: "encouraging" | "progress" | "celebratory" | "attention";
  headline: string;
  message: string;
  tip?: string;
  icon: string;
}

/**
 * Rounds a raw number up to the nearest multiple of step (e.g. 500 or 1000)
 */
function roundToStep(amount: number, step = 500): number {
  return Math.ceil(amount / step) * step;
}

/**
 * Calculates pricing tiers considering ingredient cost, effort/labor, and packaging.
 */
export function calculatePricingOptions({
  totalBatchExpenses,
  targetCups: rawTargetCups,
  laborHours = 2,
  hourlyRate = 15000,
  packagingCostPerCup = 1500,
}: PricingInput): PricingAnalysis {
  const targetCups = Math.max(1, rawTargetCups);
  const ingredientHppPerCup = Math.round(totalBatchExpenses / targetCups);
  const laborCostPerCup = Math.round((laborHours * hourlyRate) / targetCups);
  const totalHppPerCup = ingredientHppPerCup + laborCostPerCup + packagingCostPerCup;

  // Margin calculation: price = totalHpp / (1 - marginPct)
  const buildTier = (
    name: string,
    marginPct: number,
    note: string
  ): PricingTier => {
    const rawPrice = totalHppPerCup / (1 - marginPct);
    const price = roundToStep(rawPrice, 500);
    const profitPerCup = price - totalHppPerCup;
    const totalEstimatedProfit = profitPerCup * targetCups;

    return {
      name,
      marginPct: Math.round(marginPct * 100),
      price,
      profitPerCup,
      totalEstimatedProfit,
      recommendationNote: note,
    };
  };

  return {
    ingredientHppPerCup,
    laborCostPerCup,
    packagingCostPerCup,
    totalHppPerCup,
    targetCups,
    tiers: {
      friendly: buildTier(
        "🌸 Harga Ramah (30% Margin)",
        0.3,
        "Cocok untuk promo awal atau tester ke teman terdekat!"
      ),
      ideal: buildTier(
        "💖 Harga Ideal (45% Margin)",
        0.45,
        "Paling seimbang untuk menjaga laba bersih dan kas batch."
      ),
      premium: buildTier(
        "👑 Harga Premium (60% Margin)",
        0.6,
        "Sangat pas jika porsi ekstra buah mahal atau event khusus!"
      ),
    },
  };
}

/**
 * Calculates break-even point for the current batch.
 */
export function calculateBatchBreakEven({
  totalExpenses,
  avgPricePerCup,
  cupsSold,
}: BreakEvenInput): BreakEvenResult {
  const price = avgPricePerCup > 0 ? avgPricePerCup : 15000;
  const bepCups = Math.max(0, Math.ceil(totalExpenses / price));
  const remainingCupsToBep = Math.max(0, bepCups - cupsSold);
  const isBreakEvenReached = totalExpenses === 0 || cupsSold >= bepCups;
  const progressPct =
    bepCups > 0 ? Math.min(100, Math.round((cupsSold / bepCups) * 100)) : 100;

  return {
    bepCups,
    remainingCupsToBep,
    isBreakEvenReached,
    progressPct,
    cupsSold,
  };
}

/**
 * Generates proactive, warm, and cute advice based on active batch metrics.
 */
export function generateProactiveAdvice({
  totalExpenses,
  cupsSold,
  totalRevenue,
  currentProfit,
  unpaidCount,
}: ProactiveAdviceInput): ProactiveAdvice {
  if (cupsSold === 0 && totalExpenses > 0) {
    return {
      tone: "encouraging",
      icon: "🌸",
      headline: "Semangat Buka Batch Baru!",
      message:
        "Modal belanja bahan sudah tercatat rapi. Yuk catat jualan perdana hari ini! Klik tombol '+ Catat Penjualan' di bawah ya 💖",
      tip: "Tips: Cek menu '💡 Rekomendasi Harga' untuk menghitung harga jual ideal per cup.",
    };
  }

  if (cupsSold === 0 && totalExpenses === 0) {
    return {
      tone: "encouraging",
      icon: "🍓",
      headline: "Siap Mencatat Hari Ini?",
      message:
        "Batch aktif belum memiliki catatan belanja bahan atau penjualan. Mulai catat belanja bahan atau pesanan masuk ya ✨",
      tip: "Tips: Catat belanja bahan lebih dulu agar HPP dan BEP otomatis terhitung.",
    };
  }

  const avgPrice = cupsSold > 0 ? Math.round(totalRevenue / cupsSold) : 15000;
  const bep = calculateBatchBreakEven({
    totalExpenses,
    avgPricePerCup: avgPrice,
    cupsSold,
  });

  if (bep.isBreakEvenReached) {
    return {
      tone: "celebratory",
      icon: "🎉",
      headline: "Yayy! Batch Sudah Balik Modal!",
      message: `Hebat banget! Batch ini sudah balik modal dan seluruh modal belanja batch sudah tertutup rapi. Penjualan berikutnya murni keuntungan batch 💖`,
      tip:
        unpaidCount > 0
          ? `Perhatian manis: Ada ${unpaidCount} pesanan belum lunas. Jangan lupa ingatkan pelanggan dengan santun ya 🍯`
          : "Tips: Pertahankan kualitas asinan agar pelanggan repeat order!",
    };
  }

  return {
    tone: "progress",
    icon: "🍧",
    headline: `Progress Balik Modal: ${bep.progressPct}%`,
    message: `Sudah terjual ${cupsSold} cup dari target BEP ${bep.bepCups} cup. Cukup jual ${bep.remainingCupsToBep} cup lagi untuk balik modal hari ini! ✨`,
    tip:
      unpaidCount > 0
        ? `Terdapat ${unpaidCount} pesanan belum lunas. Jika dilunasi, progress balik modal akan melesat! 🌸`
        : undefined,
  };
}
