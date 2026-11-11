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

  it("sends stream: false in payload to 9router", async () => {
    let capturedBody: any;
    global.fetch = vi.fn().mockImplementation((url, opts) => {
      capturedBody = JSON.parse(opts.body);
      return Promise.resolve({
        ok: true,
        text: async () =>
          JSON.stringify({
            choices: [{ message: { content: "Pesan non-stream" } }],
          }),
      });
    });

    const reply = await askAiChat([{ role: "user", content: "Test" }]);
    expect(reply).toBe("Pesan non-stream");
    expect(capturedBody.stream).toBe(false);
  });

  it("gracefully parses SSE stream data chunks when 9router sends data: lines", async () => {
    const sseResponse = `data: {"id":"chatcmpl-1","choices":[{"delta":{"role":"assistant"},"finish_reason":null}]}

data: {"id":"chatcmpl-1","choices":[{"delta":{"content":"Halo Kak! "},"finish_reason":null}]}

data: {"id":"chatcmpl-1","choices":[{"delta":{"content":"Ada yang bisa dibantu?"},"finish_reason":null}]}

data: {"id":"chatcmpl-1","choices":[{"delta":{},"finish_reason":"stop"}]}

data: [DONE]
`;

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => sseResponse,
    } as unknown as Response);

    const reply = await askAiChat([{ role: "user", content: "Halo" }]);
    expect(reply).toBe("Halo Kak! Ada yang bisa dibantu?");
  });

  it("returns fallback message if fetch throws network error", async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error("Network connection refused"));

    const reply = await askAiChat([{ role: "user", content: "Halo" }]);
    expect(reply).toContain("Maaf, asisten AI sedang tidak dapat terhubung");
  });
});
