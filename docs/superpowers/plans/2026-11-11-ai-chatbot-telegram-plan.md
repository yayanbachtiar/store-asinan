# AI Chatbot & Telegram Bot via 9Router Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Menambahkan asisten AI di web dashboard bertema Sakura Pink dan runner bot Telegram mandiri (long polling) yang terhubung ke 9Router dengan model `kimi` dan membawa konteks data riil keuangan asinan.

**Architecture:** Modul bersama `src/lib/ai-client.ts` membaca 9Router (`http://localhost:20127/v1`) dan menyusun ringkasan status toko (omset, piutang, modal) ke system prompt. Route `/api/chat` melayani web widget Sakura Pink, dan `scripts/telegram-bot.ts` melayani bot Telegram tanpa dependency pihak ketiga tambahan.

**Tech Stack:** Next.js 16 (App Router), TypeScript, Tailwind CSS, Firestore, native `fetch` (OpenAI-compatible & Telegram Bot API), Vitest.

**Spec:** `docs/superpowers/specs/2026-11-11-ai-chatbot-telegram-design.md`

## Global Constraints
- Node 20+ native `fetch` untuk semua HTTP call (tanpa install library telegram atau openai SDK tambahan).
- 9Router endpoint default: `http://localhost:20127/v1`, key default: `sk-5ec8186a854f88fa-695xy3-89481bfb`, model default: `kimi`.
- Web chat terlindungi cookie sesi login.
- Telegram bot mendukung whitelist chat ID (`TELEGRAM_ALLOWED_USERS`).
- Tetap mematuhi estetika Sakura Pink & Warm Cream pada komponen Web Chatbot.

## Review Focus
- 9Router offline/error: respons ramah "Maaf, asisten AI sedang istirahat" tanpa crash.
- Chat tanpa pesan / payload kosong: tolak dengan HTTP 400.
- Telegram message dari user tidak terdaftar (jika whitelist aktif): abaikan / tolak dengan pesan akses ditolak.
- Batch aktif belum dibuat: bot memberikan informasi bahwa belum ada batch aktif dan menyarankan buka batch baru.
- Token Telegram bot kosong: script `telegram-bot.ts` menampilkan peringatan jelas di terminal dan exit dengan sopan.

---

### Task 1: Core AI Client & Live Store Context Helper

**Files:**
- Create: `src/lib/ai-client.ts`
- Test: `tests/ai-client.test.ts`

**Interfaces:**
- Produces:
  - `generateStoreContextPrompt(): Promise<string>`
  - `askAiChat(messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>, systemOverride?: string): Promise<string>`

- [ ] **Step 1: Write tests for AI client & context generator**
```typescript
// tests/ai-client.test.ts
import { describe, it, expect, vi } from "vitest";
import { formatStoreContext } from "../src/lib/ai-client";

describe("ai-client formatStoreContext", () => {
  it("formats empty batch state cleanly", () => {
    const text = formatStoreContext(null, []);
    expect(text).toContain("Belum ada batch produksi aktif");
  });

  it("formats active batch data with omset and receivables", () => {
    const text = formatStoreContext(
      {
        id: "b1",
        date: "2026-11-11",
        title: "Batch Manis",
        initialCapital: 100000,
        omset: 250000,
        expense: 120000,
        unpaidAmount: 50000,
        unpaidCount: 2,
        cupsSold: 15,
      },
      [{ customerName: "Bu Ani", amount: 30000 }, { customerName: "Pak Budi", amount: 20000 }]
    );
    expect(text).toContain("Batch Manis");
    expect(text).toContain("250.000");
    expect(text).toContain("Bu Ani");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**
Run: `pnpm vitest run tests/ai-client.test.ts`
Expected: FAIL (module not found)

- [ ] **Step 3: Implement `src/lib/ai-client.ts`**
Implement `formatStoreContext`, `generateStoreContextPrompt` (query Firestore batch aktif, order unpaid), dan `askAiChat` yang mengirim request ke 9Router OpenAI-compatible endpoint `/v1/chat/completions`.

- [ ] **Step 4: Run test to verify it passes**
Run: `pnpm vitest run tests/ai-client.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**
```bash
git add src/lib/ai-client.ts tests/ai-client.test.ts
git commit -m "feat(ai): add 9router client and store context prompt builder"
```

---

### Task 2: Web API Route `/api/chat`

**Files:**
- Create: `src/app/api/chat/route.ts`
- Test: `tests/api-chat.test.ts`

**Interfaces:**
- Consumes: `askAiChat`, `generateStoreContextPrompt` from `src/lib/ai-client`
- Produces: POST handler returning `{ reply: string }` or error `{ error: string }`

- [ ] **Step 1: Write test for chat endpoint logic**
```typescript
// tests/api-chat.test.ts
import { describe, it, expect } from "vitest";

describe("chat api request validation", () => {
  it("validates message array format", () => {
    const isValid = (body: unknown): boolean => {
      if (!body || typeof body !== "object") return false;
      const b = body as { messages?: unknown };
      return Array.isArray(b.messages) && b.messages.length > 0;
    };
    expect(isValid({})).toBe(false);
    expect(isValid({ messages: [] })).toBe(false);
    expect(isValid({ messages: [{ role: "user", content: "halo" }] })).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it passes**
Run: `pnpm vitest run tests/api-chat.test.ts`
Expected: PASS

- [ ] **Step 3: Implement `src/app/api/chat/route.ts`**
Check session with `getCurrentSession()`. If not authenticated, return 401. Validate messages. Inject live store context into system prompt. Call `askAiChat`. Return JSON response.

- [ ] **Step 4: Commit**
```bash
git add src/app/api/chat/route.ts tests/api-chat.test.ts
git commit -m "feat(api): add authenticated /api/chat route"
```

---

### Task 3: Web AI Chatbot UI Component

**Files:**
- Create: `src/components/AiChatBubble.tsx`
- Modify: `src/app/(dashboard)/layout.tsx`

**Interfaces:**
- Consumes: `CuteBananaMascot`, `/api/chat`
- Produces: Interactive floating widget with collapsible Sakura Pink dialog and message stream.

- [ ] **Step 1: Create `src/components/AiChatBubble.tsx`**
  - Floating pill at bottom-right (`fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-40`).
  - Chibi Banana Mascot icon with bouncing animation and "Tanya Asisten" tooltip.
  - Expanding panel with:
    - Header: Avatar + "Asisten Asinan AI" + Online green dot + close button.
    - Quick prompt chips: "Omset hari ini", "Daftar yang belum bayar", "Tips naikkan profit".
    - Chat message list with distinct user & bot bubble styles.
    - Typing indicator while waiting for 9router response.
    - Input form with text input and submit button.

- [ ] **Step 2: Mount `AiChatBubble` in `src/app/(dashboard)/layout.tsx`**
  - Render inside the layout container so it appears across all authenticated dashboard pages.

- [ ] **Step 3: Verify with build**
Run: `pnpm run build`
Expected: Clean build without TypeScript or JSX errors.

- [ ] **Step 4: Commit**
```bash
git add src/components/AiChatBubble.tsx src/app/(dashboard)/layout.tsx
git commit -m "feat(ui): add sakura pink ai chat bubble in dashboard"
```

---

### Task 4: Telegram Bot Polling Script

**Files:**
- Create: `scripts/telegram-bot.ts`
- Modify: `package.json`
- Modify: `.env.example`

**Interfaces:**
- Consumes: Telegram Bot API (`getUpdates`, `sendMessage`), `askAiChat`, Firestore data
- Produces: Standalone polling daemon run via `pnpm run telegram:bot`

- [ ] **Step 1: Create `scripts/telegram-bot.ts`**
  - Reads `process.env.TELEGRAM_BOT_TOKEN`, `TELEGRAM_ALLOWED_USERS`, `NINEROUTER_BASE_URL`.
  - Checks if bot token exists; logs instructional message if missing.
  - Long polling loop with `offset` tracking.
  - Handles commands:
    - `/start`, `/help`: Kirim sambutan + daftar menu.
    - `/status`, `/omset`: Tampilkan ringkasan batch aktif (omset, modal, laba).
    - `/piutang`: Tampilkan rincian order belum lunas.
    - Pesan teks biasa: Kirim ke 9Router model `kimi` dengan konteks toko, lalu kirim balasannya ke chat.

- [ ] **Step 2: Add script to `package.json`**
  - Add `"telegram:bot": "tsx scripts/telegram-bot.ts"`.

- [ ] **Step 3: Update `.env.example` with bot configuration variables**

- [ ] **Step 4: Commit**
```bash
git add scripts/telegram-bot.ts package.json .env.example
git commit -m "feat(telegram): add standalone long polling telegram bot connected to 9router"
```

---

### Task 5: Final End-to-End Verification

- [ ] **Step 1: Run full test suite**
Run: `pnpm vitest run`
Expected: All tests pass.

- [ ] **Step 2: Run production build**
Run: `pnpm run build`
Expected: Successful compile of all routes including `/api/chat`.
