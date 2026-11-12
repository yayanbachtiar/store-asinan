import { formatRp } from "./format";
import { logger } from "./logger";
import { buildNanaPersona } from "./nana-persona.mjs";

export interface BatchContext {
  id: string;
  date: string;
  title: string | null;
  initialCapital: number;
  omset: number;
  expense: number;
  unpaidAmount: number;
  unpaidCount: number;
  cupsSold: number;
}

export interface UnpaidOrderContext {
  customerName: string;
  amount: number;
  source?: string;
}

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

/**
 * Format status keuangan batch aktif dan daftar piutang untuk konteks LLM.
 */
export function formatStoreContext(
  batch: BatchContext | null,
  unpaidOrders: UnpaidOrderContext[] = []
): string {
  if (!batch) {
    return "Status Toko Asinan: Belum ada batch produksi aktif saat ini. Pengguna dapat membuka batch baru di menu Batch.";
  }

  const profit = batch.omset - batch.expense;
  const unpaidLines =
    unpaidOrders.length > 0
      ? unpaidOrders
          .map((u) => `- ${u.customerName}: ${formatRp(u.amount)}${u.source ? ` (${u.source})` : ""}`)
          .join("\n")
      : "Tidak ada piutang tertunggak (semua order sudah lunas).";

  return `
[DATA KEUANGAN BATCH AKTIF TOKO ASINAN]
- Tanggal Batch: ${batch.date}
- Nama/Judul: ${batch.title || "Tanpa Judul"}
- Modal Awal: ${formatRp(batch.initialCapital)}
- Total Belanja Bahan (HPP/Pengeluaran): ${formatRp(batch.expense)}
- Total Omset Penjualan: ${formatRp(batch.omset)}
- Estimasi Laba Bersih Sementara: ${formatRp(profit)}
- Total Cup Terjual: ${batch.cupsSold} cup
- Sisa Piutang Belum Lunas: ${formatRp(batch.unpaidAmount)} (${batch.unpaidCount} pesanan)

[DAFTAR PESANAN BELUM LUNAS]
${unpaidLines}
`.trim();
}

/**
 * Susun system prompt komprehensif untuk persona Chibi Banana Advisor toko asinan.
 */
export function buildSystemPrompt(storeContextText: string, userName?: string): string {
  return `${buildNanaPersona(userName)}\n\n${storeContextText}`;
}

/**
 * Ambil snapshot ringkasan batch aktif dari Firestore.
 * Aman dipanggil di server Next.js atau runner script Telegram.
 */
export async function generateStoreContextPrompt(): Promise<string> {
  try {
    const { listBatches, getBatchDetail } = await import("./data");
    const batches = await listBatches();
    const activeBatchMeta = batches.find((b) => b.status === "aktif") || batches[0];

    if (!activeBatchMeta) {
      return formatStoreContext(null, []);
    }

    const detail = await getBatchDetail(activeBatchMeta.id);
    if (!detail) {
      return formatStoreContext(null, []);
    }

    const unpaidOrders: UnpaidOrderContext[] = detail.orders
      .filter((o) => !o.payment)
      .map((o) => ({
        customerName: o.customerName,
        amount: o.total,
        source: o.source,
      }));

    const cupsSold = detail.orders.reduce(
      (sum, o) => sum + o.items.reduce((s, it) => s + (it.qty || 0), 0),
      0
    );

    const batchContext: BatchContext = {
      id: detail.batch.id,
      date: detail.batch.date,
      title: detail.batch.title,
      initialCapital: detail.batch.initialCapital,
      omset: detail.finance.omzet,
      expense: detail.finance.totalExpenses,
      unpaidAmount: detail.finance.totalReceivable,
      unpaidCount: unpaidOrders.length,
      cupsSold,
    };

    return formatStoreContext(batchContext, unpaidOrders);
  } catch (err) {
    // ponytail: fallback if database is not reachable during tests or bootstrap
    return "Status Toko Asinan: Data toko sementara offline atau dalam mode lokal.";
  }
}

/**
 * Parse respons dari OpenAI-compatible endpoint.
 * Mendukung JSON standar { choices: [{ message: { content } }] }
 * dan Server-Sent Events (SSE) data stream chunks (data: {...}) agar tidak crash
 * jika upstream/router mengirim format stream.
 */
export function parseChatCompletionResponse(rawText: string): string | null {
  const trimmed = rawText.trim();
  if (!trimmed) return null;

  // Jika response adalah Server-Sent Events (SSE) data stream
  if (trimmed.startsWith("data:") || trimmed.includes("\ndata:")) {
    const lines = trimmed.split("\n");
    let accumulated = "";

    for (const line of lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine.startsWith("data:")) continue;
      const jsonStr = trimmedLine.slice(5).trim();
      if (!jsonStr || jsonStr === "[DONE]") continue;

      try {
        const chunk = JSON.parse(jsonStr) as {
          choices?: Array<{
            delta?: { content?: string };
            message?: { content?: string };
          }>;
        };
        const delta =
          chunk.choices?.[0]?.delta?.content ||
          chunk.choices?.[0]?.message?.content ||
          "";
        accumulated += delta;
      } catch {
        // Abaikan chunk non-JSON (misal heartbeat)
      }
    }

    return accumulated.trim() || null;
  }

  // Jika response adalah standard JSON chat completion
  try {
    const data = JSON.parse(trimmed) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    return data.choices?.[0]?.message?.content?.trim() || null;
  } catch {
    return null;
  }
}

/**
 * Panggil 9Router OpenAI-compatible chat completion.
 */
export async function askAiChat(
  messages: ChatMessage[],
  systemOverride?: string,
  userName?: string
): Promise<string> {
  const baseUrl = process.env.NINEROUTER_BASE_URL || "http://localhost:20127/v1";
  const apiKey = process.env.NINEROUTER_API_KEY || "sk-5ec8186a854f88fa-695xy3-89481bfb";
  const model = process.env.NINEROUTER_MODEL || "kimi";

  const systemContent = systemOverride || buildSystemPrompt(await generateStoreContextPrompt(), userName);

  const fullMessages: ChatMessage[] = [
    { role: "system", content: systemContent },
    ...messages.filter((m) => m.role !== "system"),
  ];

  try {
    const res = await fetch(`${baseUrl.replace(/\/+$/, "")}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: fullMessages,
        temperature: 0.8,
        stream: false,
      }),
    });

    if (!res.ok) {
      const errBody = await res.text().catch(() => "");
      logger.error("9Router AI Error", undefined, {
        status: res.status,
        body: errBody,
        baseUrl,
        model,
      });
      return "Mohon maaf ya Kak, Nana lagi kesulitan menjawab sebentar 🙏 Boleh coba kirim lagi sebentar lagi?";
    }

    let rawText: string;
    if (typeof res.text === "function") {
      rawText = await res.text();
    } else if (typeof res.json === "function") {
      rawText = JSON.stringify(await res.json());
    } else {
      rawText = "";
    }
    const reply = parseChatCompletionResponse(rawText);

    if (!reply) {
      logger.warn("9Router empty or unparseable response", {
        rawLength: rawText.length,
        preview: rawText.slice(0, 150),
      });
      return "Maaf ya Kak, Nana belum menemukan kata yang pas 🙏 Boleh ditanyakan sekali lagi?";
    }

    return reply;
  } catch (error) {
    logger.error("9Router Connection Failed", error, { baseUrl, model });
    return "Maaf ya Kak, Nana belum bisa terhubung saat ini 🙏 Nanti Nana bantu lagi kalau sudah pulih ya.";
  }
}
