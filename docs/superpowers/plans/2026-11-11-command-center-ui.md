# Financial Command Center Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the main dashboard (`/`) into a fast, minimal-click Financial Command Center for asinan store operations, featuring KPI cards, quick order/expense modals with rupiah formatting, and a data-dense transaction table.

**Architecture:** Next.js 15 App Router Server Component (`src/app/(dashboard)/page.tsx`) queries active batch and master records, passing data into an interactive Client Component tree (`src/components/command-center/*`) for modals and tab filtering. Theme refreshed to Emerald 600 + Slate 50.

**Tech Stack:** Next.js 15, React 19, Tailwind CSS v4, TypeScript, Vitest.

**Spec:** `docs/superpowers/specs/2026-11-11-command-center-ui-design.md`

## Global Constraints

- Never break existing Firestore schemas or `/api/*` contracts.
- Active batch transactions must pass valid `batchId`.
- Currency formatting must cleanly handle raw digits and localized `Rp` display.
- Design theme tokens: Background `bg-slate-50`, Accent `emerald-600` (`#059669`), Cards `bg-white/90` with `border-slate-200`.

## Review Focus

1. **Non-numeric/garbled input in rupiah formatter**: Typing letters or pasting symbols must sanitize to clean integer digits without throwing NaN.
2. **Order with zero items**: Submitting order with no products selected must be prevented with a clear validation message.
3. **Sequential payment failure during "Langsung Lunas"**: If `POST /api/orders` succeeds but `POST /api/payments` fails, the order remains created as unpaid and notifies user to retry payment.
4. **No active batch fallback**: When all batches are closed or zero batches exist, dashboard displays clear CTA to create a new batch.
5. **Mobile table overflow**: Tight 12px table must scroll horizontally on small screens without breaking card containers.

---

### Task 1: Rupiah Formatting & Parsing Helpers

**Files:**
- Modify: `src/lib/format.ts`
- Test: `tests/format.test.ts`

**Interfaces:**
- Produces:
  ```ts
  export function formatRupiahInput(raw: string | number): string;
  export function parseRupiahInput(formatted: string): number;
  ```

- [ ] **Step 1: Write the failing tests in `tests/format.test.ts`**

```ts
import { describe, expect, it } from "vitest";
import { formatRupiahInput, parseRupiahInput } from "@/lib/format";

describe("Rupiah input helpers", () => {
  it("formats raw digit strings to currency display", () => {
    expect(formatRupiahInput("150000")).toBe("Rp 150.000");
    expect(formatRupiahInput("0")).toBe("Rp 0");
    expect(formatRupiahInput("")).toBe("");
  });

  it("sanitizes dirty input before formatting", () => {
    expect(formatRupiahInput("Rp 25.000")).toBe("Rp 25.000");
    expect(formatRupiahInput("abc12000xyz")).toBe("Rp 12.000");
  });

  it("parses formatted string back into number", () => {
    expect(parseRupiahInput("Rp 150.000")).toBe(150000);
    expect(parseRupiahInput("")).toBe(0);
    expect(parseRupiahInput("Rp 0")).toBe(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test tests/format.test.ts`
Expected: FAIL with "formatRupiahInput is not defined"

- [ ] **Step 3: Implement `formatRupiahInput` and `parseRupiahInput` in `src/lib/format.ts`**

Add regex replacement to strip non-digits, format with thousand separators, and parse back safely to integer.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test tests/format.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/format.ts tests/format.test.ts
git commit -m "feat: add rupiah input formatting helpers"
```

---

### Task 2: Theme & Layout Palette Update (Emerald 600 + Slate 50)

**Files:**
- Modify: `src/app/globals.css`
- Modify: `src/app/(dashboard)/layout.tsx`
- Modify: `src/components/ui.tsx`

**Interfaces:**
- Consumes: Tailwind CSS v4 utility classes.
- Produces: Updated base background, updated header & nav pill styles, updated `StatCard` surface styling.

- [ ] **Step 1: Update `src/app/globals.css`**

Replace `bg-amber-50` with `bg-slate-50 text-slate-900`. Update standard inputs to focus with emerald ring.

- [ ] **Step 2: Update `src/app/(dashboard)/layout.tsx`**

Style header title with emerald accent, update navigation links from `ring-amber-200 hover:bg-amber-100` to `border border-slate-200 bg-white/80 hover:bg-emerald-50 hover:text-emerald-700`.

- [ ] **Step 3: Update `src/components/ui.tsx`**

Update `StatCard` border to `border-slate-200/80` and surface to soft frosted `bg-white/90 shadow-sm`. Update `DbUnavailable` to clean slate/amber warning card.

- [ ] **Step 4: Verify with test suite**

Run: `pnpm test`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/app/globals.css src/app/(dashboard)/layout.tsx src/components/ui.tsx
git commit -m "style: update palette to emerald and slate-50"
```

---

### Task 3: Quick Action Modals (`QuickOrderModal` & `QuickExpenseModal`)

**Files:**
- Create: `src/components/command-center/QuickOrderModal.tsx`
- Create: `src/components/command-center/QuickExpenseModal.tsx`

**Interfaces:**
- Consumes:
  - `ProductOpt` (`id, name, price, isActive`)
  - `CustomerOpt` (`id, name`)
  - `MemberOpt` (`id, name`)
  - `formatRupiahInput`, `parseRupiahInput`, `formatRp` from `src/lib/format`
- Produces:
  ```ts
  export function QuickOrderModal({
    batchId,
    products,
    customers,
    currentMemberId,
    isOpen,
    onClose,
  }: QuickOrderModalProps): React.JSX.Element | null;

  export function QuickExpenseModal({
    batchId,
    members,
    currentMemberId,
    isOpen,
    onClose,
  }: QuickExpenseModalProps): React.JSX.Element | null;
  ```

- [ ] **Step 1: Create `src/components/command-center/QuickOrderModal.tsx`**

Implement modal dialog:
- Chips for all active products: click chip adds or increments quantity.
- Selected items list with +/- buttons and item subtotal.
- Customer dropdown with quick "+ Pelanggan baru" inline toggle.
- Order Source: Langsung (default), WA, Puskesmas.
- Checkbox "Langsung Lunas" (default: checked).
  - If checked, calls `POST /api/orders`, gets order ID, then calls `POST /api/payments` with `method: "cash"` and `receivedBy: currentMemberId`.
- Auto-calculated total in bold emerald text.

- [ ] **Step 2: Create `src/components/command-center/QuickExpenseModal.tsx`**

Implement modal dialog:
- Description input (e.g. "Buah nanas & mangga").
- Amount input using `formatRupiahInput` on change (`parseRupiahInput` on submit).
- Paid by member dropdown (defaults to `currentMemberId`).
- Submits to `POST /api/expenses`.

- [ ] **Step 3: Run build check to verify syntax and types**

Run: `pnpm build`
Expected: Build passes or cleanly compiles new components.

- [ ] **Step 4: Commit**

```bash
git add src/components/command-center/QuickOrderModal.tsx src/components/command-center/QuickExpenseModal.tsx
git commit -m "feat: add quick order and expense modals"
```

---

### Task 4: Transaction Table & Tab Filter (`TransactionTable`)

**Files:**
- Create: `src/components/command-center/TransactionTable.tsx`

**Interfaces:**
- Consumes:
  - `orders`: Array of orders with `customerName`, `total`, `payment`, `items`, `createdAt`.
  - `expenses`: Array of expenses with `paidByName`, `amount`, `description`, `createdAt`.
  - `currentMemberId`: string
- Produces:
  ```ts
  export function TransactionTable({
    orders,
    expenses,
    currentMemberId,
  }: TransactionTableProps): React.JSX.Element;
  ```

- [ ] **Step 1: Implement `src/components/command-center/TransactionTable.tsx`**

- Tab switches: `Penjualan` and `Belanja Bahan`.
- Filter pills under `Penjualan`: `Semua`, `Lunas`, `Belum Bayar (Tempo)`.
- Data table styling:
  - Zebra striping (`bg-white` / `bg-slate-50/60`).
  - Rata kiri: Jam, Nama Pelanggan & rincian item.
  - Rata kanan: Qty, Total (bold).
  - Status column:
    - Lunas: Pill hijau `bg-emerald-100 text-emerald-800`.
    - Belum Bayar: Pill kuning/amber `bg-amber-100 text-amber-800` + Tombol "Lunasi" (1-klik melunasi secara tunai).
- Tab `Belanja Bahan`:
  - List pengeluaran bahan dengan tanggal/jam, keterangan, pembayar, nominal rata kanan, dan tombol hapus.

- [ ] **Step 2: Run build check**

Run: `pnpm build`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/components/command-center/TransactionTable.tsx
git commit -m "feat: add data-dense transaction table with tabs and quick settlement"
```

---

### Task 5: Command Center View & Dashboard Integration

**Files:**
- Create: `src/components/command-center/CommandCenterView.tsx`
- Modify: `src/app/(dashboard)/page.tsx`

**Interfaces:**
- Connects Server Component data fetch in `src/app/(dashboard)/page.tsx` with `CommandCenterView`.
- Computes:
  - `totalPortionsSold = orders.flatMap(o => o.items).reduce((s, i) => s + i.qty, 0)`
  - Active batch KPI cards: Omset, Piutang, Total Porsi/Cup Terjual, Laba Batch.

- [ ] **Step 1: Create `src/components/command-center/CommandCenterView.tsx`**

Client component that renders:
- Zona 2: Quick Action Bar (`+ Catat Penjualan`, `- Catat Belanja Bahan`, shift/status info).
- Controls visibility state of `QuickOrderModal` and `QuickExpenseModal`.
- Zona 3: Embeds `TransactionTable`.

- [ ] **Step 2: Revamp `src/app/(dashboard)/page.tsx`**

- Read active batch, detail, products, customers, members, and current logged-in user.
- Render:
  - Header: Active batch banner & date.
  - Zona 1: KPI Summary cards (Omset, Piutang, Porsi Terjual, Laba & ROI).
  - CommandCenterView (Zona 2 & Zona 3).
- Fallback when no active batch: friendly card to create or activate a batch.

- [ ] **Step 3: Run full test suite and build**

Run: `pnpm test && pnpm build`
Expected: All tests pass, build succeeds with zero errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/command-center/CommandCenterView.tsx src/app/(dashboard)/page.tsx
git commit -m "feat: integrate command center dashboard on home page"
```
