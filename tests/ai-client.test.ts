import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  formatStoreContext,
  buildSystemPrompt,
  askAiChat,
  type BatchContext,
  type UnpaidOrderContext,
} from "../src/lib/ai-client";

describe("ai-client formatStoreContext", () => {
  it("formats empty batch state cleanly", () => {
    const text = formatStoreContext(null, []);
    expect(text).toContain("Belum ada batch produksi aktif");
  });

  it("formats active batch data with omset and receivables", () => {
    const batch: BatchContext = {
      id: "b1",
      date: "2026-11-11",
      title: "Batch Manis",
      initialCapital: 100000,
      omset: 250000,
      expense: 120000,
      unpaidAmount: 50000,
      unpaidCount: 2,
      cupsSold: 15,
    };
    const unpaid: UnpaidOrderContext[] = [
      { customerName: "Bu Ani", amount: 30000 },
      { customerName: "Pak Budi", amount: 20000 },
    ];
    const text = formatStoreContext(batch, unpaid);
    expect(text).toContain("Batch Manis");
    expect(text).toContain("250.000");
    expect(text).toContain("Bu Ani");
    expect(text).toContain("Pak Budi");
  });
});

describe("ai-client buildSystemPrompt", () => {
  it("contains persona and rules for Asinan assistant", () => {
    const prompt = buildSystemPrompt("Context toko test");
    expect(prompt).toContain("Asisten AI Toko Asinan");
    expect(prompt).toContain("Context toko test");
    expect(prompt).toContain("Rupiah");
  });
});

describe("ai-client askAiChat", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("returns reply text when 9router returns successful chat completion", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
              content: "Halo! Omset batch aktif saat ini Rp250.000.",
            },
          },
        ],
      }),
    } as unknown as Response);

    const reply = await askAiChat([{ role: "user", content: "Halo" }]);
    expect(reply).toBe("Halo! Omset batch aktif saat ini Rp250.000.");
  });

  it("returns fallback message if fetch throws network error", async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error("Network connection refused"));

    const reply = await askAiChat([{ role: "user", content: "Halo" }]);
    expect(reply).toContain("Maaf, asisten AI sedang tidak dapat terhubung");
  });
});
