/**
 * Logika keuangan MURNI (tanpa DB, tanpa Next) — mudah diuji.
 *
 * Prinsip inti aplikasi:
 * - Status BAYAR ≠ status SETOR. Pelanggan bisa sudah membayar ke seorang
 *   anggota, tetapi uangnya belum tentu sudah disetor ke bendahara.
 * - Kas bendahara = pembayaran yang diterima langsung oleh bendahara
 *   + setoran anggota yang sudah berstatus "diterima".
 * - Rekonsiliasi yang selalu harus klop:
 *     omzet = kas bendahara + belum disetor (di tangan anggota) + piutang
 * - Semua angka laporan dihitung di sini secara deterministik. AI tidak
 *   pernah menghitung uang (AI hanya membantu input di tahap berikutnya).
 */

export type OrderLike = {
  id: number;
  customerName?: string;
  /** Total order, dihitung dari order_items (harga snapshot × qty). */
  total: number;
  paymentStatus: "belum" | "sudah";
};

export type PaymentLike = {
  orderId: number;
  amount: number;
  receivedBy: number;
};

export type SettlementLike = {
  memberId: number;
  amount: number;
  status: "menunggu" | "diterima";
};

export type AdvanceLike = {
  memberId: number;
  amount: number;
  status: "belum_diganti" | "diganti";
};

export type AllocationLike = {
  kind: "ditahan" | "diputar" | "dibagi";
  memberId?: number | null;
  amount: number;
};

export type BatchFinanceInput = {
  /** members.id milik bendahara (role='bendahara'). */
  treasurerId: number;
  expenses: { amount: number }[];
  orders: OrderLike[];
  payments: PaymentLike[];
  settlements: SettlementLike[];
  advances: AdvanceLike[];
  allocations: AllocationLike[];
};

export type MemberPosition = {
  memberId: number;
  /** Total pembayaran pelanggan yang diterima anggota ini. */
  received: number;
  /** Total setoran anggota ini yang sudah diterima bendahara. */
  settledAccepted: number;
  /** Total setoran yang masih menunggu konfirmasi bendahara. */
  settledPending: number;
  /** Uang yang masih di tangan anggota ini (received - setoran diterima). */
  outstanding: number;
};

export type BatchFinance = {
  totalExpenses: number;
  omzet: number;
  profit: number;
  /** Persen, 2 desimal. null bila total biaya = 0 (menghindari bagi-nol). */
  roiOnCostPct: number | null;
  marginOnRevenuePct: number | null;
  totalPaid: number;
  totalReceivable: number;
  treasurerCash: number;
  totalUnsettled: number;
  outstandingAdvances: number;
  allocationTotal: number;
  allocationByKind: Record<"ditahan" | "diputar" | "dibagi", number>;
  memberPositions: MemberPosition[];
  /** omzet − (kas + belum setor + piutang); harus 0 pada data yang konsisten. */
  reconciliationDiff: number;
};

/** Total satu order dari item-itemnya (memakai harga snapshot). */
export function orderTotal(items: { priceSnapshot: number; qty: number }[]): number {
  return items.reduce((sum, item) => sum + item.priceSnapshot * item.qty, 0);
}

function pct(part: number, whole: number): number | null {
  if (whole === 0) return null;
  return Math.round((part / whole) * 10000) / 100;
}

export function computeBatchFinance(input: BatchFinanceInput): BatchFinance {
  const totalExpenses = input.expenses.reduce((s, e) => s + e.amount, 0);
  const omzet = input.orders.reduce((s, o) => s + o.total, 0);
  const profit = omzet - totalExpenses;

  const totalReceivable = input.orders
    .filter((o) => o.paymentStatus === "belum")
    .reduce((s, o) => s + o.total, 0);
  const totalPaid = input.payments.reduce((s, p) => s + p.amount, 0);

  // Posisi per anggota: terima pembayaran − setoran yang sudah diterima.
  const positions = new Map<number, MemberPosition>();
  const ensure = (memberId: number): MemberPosition => {
    let pos = positions.get(memberId);
    if (!pos) {
      pos = { memberId, received: 0, settledAccepted: 0, settledPending: 0, outstanding: 0 };
      positions.set(memberId, pos);
    }
    return pos;
  };
  for (const p of input.payments) ensure(p.receivedBy).received += p.amount;
  for (const s of input.settlements) {
    const pos = ensure(s.memberId);
    if (s.status === "diterima") pos.settledAccepted += s.amount;
    else pos.settledPending += s.amount;
  }
  for (const pos of positions.values()) {
    pos.outstanding = pos.received - pos.settledAccepted;
  }

  const treasurerPayments = input.payments
    .filter((p) => p.receivedBy === input.treasurerId)
    .reduce((s, p) => s + p.amount, 0);
  const settledToTreasurer = input.settlements
    .filter((s) => s.status === "diterima")
    .reduce((s, x) => s + x.amount, 0);
  const treasurerCash = treasurerPayments + settledToTreasurer;

  // Belum disetor = uang di tangan anggota SELAIN bendahara (uang di tangan
  // bendahara sendiri sudah termasuk kas). Posisi bendahara dikeluarkan
  // agar rekonsiliasi tidak menghitung ganda.
  const totalUnsettled = [...positions.values()]
    .filter((pos) => pos.memberId !== input.treasurerId)
    .reduce((s, pos) => s + pos.outstanding, 0);

  const outstandingAdvances = input.advances
    .filter((a) => a.status === "belum_diganti")
    .reduce((s, a) => s + a.amount, 0);

  const allocationByKind: Record<"ditahan" | "diputar" | "dibagi", number> = {
    ditahan: 0,
    diputar: 0,
    dibagi: 0,
  };
  for (const a of input.allocations) allocationByKind[a.kind] += a.amount;
  const allocationTotal = input.allocations.reduce((s, a) => s + a.amount, 0);

  return {
    totalExpenses,
    omzet,
    profit,
    roiOnCostPct: pct(profit, totalExpenses),
    marginOnRevenuePct: pct(profit, omzet),
    totalPaid,
    totalReceivable,
    treasurerCash,
    totalUnsettled,
    outstandingAdvances,
    allocationTotal,
    allocationByKind,
    memberPositions: [...positions.values()].sort((a, b) => a.memberId - b.memberId),
    reconciliationDiff: omzet - (treasurerCash + totalUnsettled + totalReceivable),
  };
}

/**
 * Validasi alokasi laba: jumlah alokasi (ditahan + diputar + dibagi)
 * WAJIB persis sama dengan laba batch. Selisih positif = kelebihan,
 * negatif = masih kurang.
 */
export function validateAllocations(
  profit: number,
  allocations: AllocationLike[],
): { ok: boolean; total: number; diff: number } {
  const total = allocations.reduce((s, a) => s + a.amount, 0);
  return { ok: total === profit, total, diff: total - profit };
}

/** Kelompokkan order belum bayar per pelanggan (untuk halaman Piutang). */
export function groupReceivables<T extends OrderLike>(
  orders: T[],
): { customerName: string; total: number; orders: T[] }[] {
  const groups = new Map<string, { customerName: string; total: number; orders: T[] }>();
  for (const order of orders) {
    if (order.paymentStatus !== "belum") continue;
    const name = order.customerName ?? "?";
    const group = groups.get(name) ?? { customerName: name, total: 0, orders: [] };
    group.total += order.total;
    group.orders.push(order);
    groups.set(name, group);
  }
  return [...groups.values()].sort((a, b) => b.total - a.total);
}
