import { describe, expect, it } from "vitest";
import {
  calculateBatchBreakEven,
  calculatePricingOptions,
  generateProactiveAdvice,
} from "@/lib/financial-advisor";

describe("Financial Advisor logic", () => {
  it("calculates pricing options with ingredient HPP, packaging, and labor effort", () => {
    const result = calculatePricingOptions({
      totalBatchExpenses: 150000,
      targetCups: 20,
      laborHours: 2,
      hourlyRate: 15000,
      packagingCostPerCup: 1500,
    });

    // 150000 / 20 = 7500 per cup ingredient
    expect(result.ingredientHppPerCup).toBe(7500);
    // (2 * 15000) / 20 = 1500 per cup labor
    expect(result.laborCostPerCup).toBe(1500);
    expect(result.packagingCostPerCup).toBe(1500);
    // Total HPP = 7500 + 1500 + 1500 = 10500
    expect(result.totalHppPerCup).toBe(10500);

    // Tiers should be calculated and rounded
    expect(result.tiers.friendly.price).toBeGreaterThan(result.totalHppPerCup);
    expect(result.tiers.ideal.price).toBeGreaterThan(result.tiers.friendly.price);
    expect(result.tiers.premium.price).toBeGreaterThan(result.tiers.ideal.price);
    expect(result.tiers.ideal.profitPerCup).toBe(result.tiers.ideal.price - result.totalHppPerCup);
  });

  it("calculates break-even point accurately", () => {
    const bep = calculateBatchBreakEven({
      totalExpenses: 120000,
      avgPricePerCup: 15000,
      cupsSold: 5,
    });

    // 120000 / 15000 = 8 cups to break even
    expect(bep.bepCups).toBe(8);
    expect(bep.remainingCupsToBep).toBe(3);
    expect(bep.isBreakEvenReached).toBe(false);
    expect(bep.progressPct).toBe(63); // 5/8 * 100 = 62.5 -> 63%
  });

  it("handles break-even reached scenario", () => {
    const bep = calculateBatchBreakEven({
      totalExpenses: 100000,
      avgPricePerCup: 15000,
      cupsSold: 10,
    });

    expect(bep.bepCups).toBe(7); // ceil(100000/15000) = 7
    expect(bep.remainingCupsToBep).toBe(0);
    expect(bep.isBreakEvenReached).toBe(true);
    expect(bep.progressPct).toBe(100);
  });

  it("generates friendly and cute proactive advice strings", () => {
    const advice1 = generateProactiveAdvice({
      totalExpenses: 100000,
      cupsSold: 0,
      totalRevenue: 0,
      currentProfit: -100000,
      unpaidCount: 0,
    });
    expect(advice1.tone).toBe("encouraging");
    expect(advice1.message).toContain("Yuk catat jualan");

    const advice2 = generateProactiveAdvice({
      totalExpenses: 100000,
      cupsSold: 10,
      totalRevenue: 150000,
      currentProfit: 50000,
      unpaidCount: 2,
    });
    expect(advice2.tone).toBe("celebratory");
    expect(advice2.message).toContain("balik modal");
  });
});
