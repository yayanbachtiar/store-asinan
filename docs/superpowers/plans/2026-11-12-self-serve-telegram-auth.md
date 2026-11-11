# Self-Serve Telegram User ID Linking & Dynamic Bot Authorization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow logged-in dashboard users to self-serve link/unlink their Telegram User ID in Pengaturan with clear instructions on finding their ID, and have the Telegram Bot dynamically authorize against active Firestore members.

**Architecture:** Next.js route handler `PATCH /api/members/me` handles self-linking with uniqueness checks. `TelegramSelfLinkCard` in `/pengaturan` provides a pastel sakura UI with step-by-step ID-finding tutorials. `scripts/telegram-bot.mjs` queries Firestore `members` to dynamically authorize users, greeting members by name and returning 1-tap copyable IDs to unauthorized users.

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript, Zod, Firebase Admin Firestore, Node.js fetch (Telegram Bot API).

**Spec:** `docs/superpowers/specs/2026-11-12-self-serve-telegram-auth-design.md`

## Global Constraints
- Do not introduce external npm dependencies for Telegram.
- Strictly adhere to Sakura Pink & Cream theme (rounded-3xl, pastel badges, `#2D1B2D` text).
- Input validation: strip leading `@`, trim whitespace, max 64 characters, unique across all members.
- Dynamic runtime check in bot: only members where `isActive: true` are authorized.

## Review Focus
- Unlinking: Setting `telegramId` to empty or null must clear the field without violating uniqueness.
- Uniqueness collision: Trying to save a Telegram ID already claimed by another active member must return a descriptive 400 error.
- Case-insensitivity & format: User entering `@username` vs `username` vs numeric ID `123456789` must match reliably.
- Bot unauthorized message: Must contain user's numeric ID formatted in Markdown monospace (``` `123456789` ```) for mobile 1-tap copy.
- Fallback preservation: `TELEGRAM_ALLOWED_USERS` in `.env` remains respected as secondary authorization if Firestore is empty or for emergency admin override.

---

### Task 1: API Endpoint `GET` & `PATCH /api/members/me`

**Files:**
- Create: `src/app/api/members/me/route.ts`
- Test: `tests/api-members-me.test.ts`

**Interfaces:**
- Consumes: `requireApiMember()` from `@/lib/auth`, `getMember()`, `updateMember()`, `findMemberByTelegramId()` from `@/lib/repo/members`.
- Produces: `GET /api/members/me` returning current member, `PATCH /api/members/me` updating `telegramId`.

- [ ] **Step 1: Write the failing test**

```typescript
// tests/api-members-me.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/auth", () => ({
  requireApiMember: vi.fn(),
}));

vi.mock("@/lib/repo/members", () => ({
  getMember: vi.fn(),
  updateMember: vi.fn(),
  findMemberByTelegramId: vi.fn(),
}));

describe("API /api/members/me", () => {
  it("rejects unauthorized request if no session", async () => { ... });
  it("GET returns current member details including telegramId", async () => { ... });
  it("PATCH strips leading @ and updates telegramId", async () => { ... });
  it("PATCH rejects if telegramId is already used by another member", async () => { ... });
  it("PATCH allows clearing telegramId with null or empty string", async () => { ... });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run tests/api-members-me.test.ts`
Expected: FAIL ("Cannot find module '@/app/api/members/me/route'")

- [ ] **Step 3: Implement `GET` and `PATCH` in `src/app/api/members/me/route.ts`**

Implement route handler:
- `guardApi()` and check `requireApiMember()`.
- `GET`: return `getMember(session.id)`.
- `PATCH`: parse with Zod `{ telegramId: z.string().trim().max(64).nullable().optional() }`. Clean `@` prefix. If non-empty, check `findMemberByTelegramId(cleaned)`. If taken by other member, return 400. Update via `updateMember(session.id, { telegramId: cleaned || null })`.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run tests/api-members-me.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/app/api/members/me/route.ts tests/api-members-me.test.ts
git commit -m "feat(api): add GET and PATCH /api/members/me for self-serve profile update"
```

---

### Task 2: UI Component `TelegramSelfLinkCard` & Embed in `/pengaturan`

**Files:**
- Modify: `src/components/forms.tsx`
- Modify: `src/app/(dashboard)/pengaturan/page.tsx`
- Test: `tests/telegram-self-link.test.ts`

**Interfaces:**
- Consumes: `PATCH /api/members/me`, `getCurrentMember()` from `@/lib/auth`, `getMember()`.
- Produces: `TelegramSelfLinkCard` client component rendered in `/pengaturan`.

- [ ] **Step 1: Write the failing test**

```typescript
// tests/telegram-self-link.test.ts
import { describe, it, expect } from "vitest";

describe("Telegram self-link helper formatting", () => {
  it("sanitizes telegram handle input by removing leading @", () => { ... });
  it("formats instructions with copyable telegram bot tag", () => { ... });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run tests/telegram-self-link.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement `TelegramSelfLinkCard` in `src/components/forms.tsx` and mount in `src/app/(dashboard)/pengaturan/page.tsx`**

Features:
- Card with cute mascot/telegram badge, title "Akun Telegram Saya".
- Displays current status: "🟢 Terhubung: @{id}" or "⚪ Belum Terhubung".
- Input field with placeholder "Contoh: 123456789 atau username".
- Action buttons: "Simpan ID Telegram", and "Putuskan" if currently linked.
- Instructional box explaining:
  - 1. Buka bot Telegram Toko kami, kirim pesan apa saja. Bot otomatis membalas dengan ID Anda!
  - 2. Atau cek via `@userinfobot`.
  - 3. Salin angka ID tersebut dan simpan di sini.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run tests/telegram-self-link.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/forms.tsx src/app/(dashboard)/pengaturan/page.tsx tests/telegram-self-link.test.ts
git commit -m "feat(ui): add TelegramSelfLinkCard in pengaturan page"
```

---

### Task 3: Dynamic Firestore Member Authorization in `scripts/telegram-bot.mjs`

**Files:**
- Modify: `scripts/telegram-bot.mjs`
- Test: `tests/telegram-bot-auth.test.ts`

**Interfaces:**
- Consumes: Firestore `members` collection, Telegram update `msg.from`.
- Produces: `authorizeTelegramUser(user, db, fallbackAllowedUsers)`.

- [ ] **Step 1: Write the failing test**

```typescript
// tests/telegram-bot-auth.test.ts
import { describe, it, expect } from "vitest";

describe("Telegram Bot Dynamic Authorization", () => {
  it("authorizes user matching active member numeric telegramId", () => { ... });
  it("authorizes user matching active member username without case-sensitivity", () => { ... });
  it("rejects inactive member even if telegramId matches", () => { ... });
  it("falls back to TELEGRAM_ALLOWED_USERS env var if no member match", () => { ... });
  it("formats unauthorized rejection message with monospace user ID", () => { ... });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run tests/telegram-bot-auth.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement dynamic authorization in `scripts/telegram-bot.mjs`**

Implement:
- Function `findActiveMemberByTelegram(db, user)` querying Firestore `members` where `isActive == true`. Matches numeric `user.id` or string `user.username`.
- Authorization flow:
  - If member found: greet personalized `Halo Kak ${member.name}! 🍌`.
  - If not found but in `TELEGRAM_ALLOWED_USERS`: allow fallback.
  - If not authorized: reply with:
    `⛔ Akses Ditolak.\n\nAkun Telegram Anda belum terhubung ke Kas Asinan.\n*ID Telegram Anda:* \`${from.id}\`\n\n📌 *Cara Menghubungkan:*\n1. Login ke Dashboard Kas Asinan\n2. Buka menu *Pengaturan* > *Akun Telegram Saya*\n3. Masukkan ID \`${from.id}\` lalu klik Simpan.`

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run tests/telegram-bot-auth.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add scripts/telegram-bot.mjs tests/telegram-bot-auth.test.ts
git commit -m "feat(bot): add dynamic Firestore member authorization with 1-tap ID helper"
```
