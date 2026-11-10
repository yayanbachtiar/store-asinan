import { computeBatchFinance, orderTotal, type BatchFinance } from "./finance";
import { listAdvances, listAdvancesByBatch } from "./repo/advances";
import { listAllocationsByBatch } from "./repo/allocations";
import { getBatch, listBatches } from "./repo/batches";
import { listCustomers } from "./repo/customers";
import { listExpensesByBatch } from "./repo/expenses";
import { getTreasurer as findTreasurer, listMembers } from "./repo/members";
import { listOrdersByBatch, listOrdersByPaymentStatus } from "./repo/orders";
import { listPayments, listPaymentsByBatch } from "./repo/payments";
import { listProducts } from "./repo/products";
import { listSettlements } from "./repo/settlements";
import type {
  Advance,
  Batch,
  Customer,
  Expense,
  Member,
  Order,
  Payment,
  Product,
  ProfitAllocation,
  Settlement,
} from "./types";

/**
 * Lapisan baca untuk halaman dashboard, di atas repository Firestore.
 *
 * Agregasi laporan TIDAK memakai query agregat: dokumen per batch dibaca
 * apa adanya lalu dihitung oleh lib/finance.ts (murni) di server. Untuk
 * skala aplikasi ini (5 pengguna, ±30 order per batch) itu memang cukup —
 * dan hasilnya deterministik serta mudah diuji.
 *
 * Semua fungsi boleh melempar Error saat Firestore belum terkonfigurasi /
 * tidak terjangkau: penelepon (halaman) membungkus dengan try/catch dan
 * menampilkan keadaan "database belum tersedia".
 */

export { listBatches, listCustomers, listMembers, listProducts };
export type { Batch, Customer, Member, Product };

export type BatchDetail = {
  batch: Batch;
  expenses: (Expense & { paidByName: string })[];
  orders: (Order & {
    customerName: string;
    total: number;
    payment: Payment | null;
  })[];
  settlements: (Settlement & { memberName: string })[];
  advances: (Advance & { memberName: string })[];
  allocations: (ProfitAllocation & { memberName: string | null })[];
  finance: BatchFinance;
  treasurer: { id: string; name: string } | null;
};

export async function getTreasurer(): Promise<{ id: string; name: string } | null> {
  const treasurer = await findTreasurer();
  return treasurer ? { id: treasurer.id, name: treasurer.name } : null;
}

export async function getBatchDetail(batchId: string): Promise<BatchDetail | null> {
  const batch = await getBatch(batchId);
  if (!batch) return null;

  const [memberRows, customerRows, treasurer] = await Promise.all([
    listMembers(),
    listCustomers(),
    getTreasurer(),
  ]);
  const memberName = new Map(memberRows.map((m) => [m.id, m.name]));
  const customerName = new Map(customerRows.map((c) => [c.id, c.name]));

  const [expenseRows, orderRows, paymentRows, settlementRows, advanceRows, allocationRows] =
    await Promise.all([
      listExpensesByBatch(batchId),
      listOrdersByBatch(batchId),
      listPaymentsByBatch(batchId),
      // Setoran tidak terikat batch (uang anggota lintas batch) — posisi kas
      // dihitung global agar tidak dobel antar-batch.
      listSettlements(),
      listAdvancesByBatch(batchId),
      listAllocationsByBatch(batchId),
    ]);

  const paymentByOrder = new Map(paymentRows.map((p) => [p.orderId, p]));
  const detailOrders = orderRows.map((order) => ({
    ...order,
    customerName: customerName.get(order.customerId) ?? "?",
    total: orderTotal(order.items),
    payment: paymentByOrder.get(order.id) ?? null,
  }));

  const finance = computeBatchFinance({
    treasurerId: treasurer?.id ?? "",
    expenses: expenseRows,
    orders: detailOrders,
    payments: paymentRows,
    settlements: settlementRows,
    advances: advanceRows,
    allocations: allocationRows,
  });

  return {
    batch,
    expenses: expenseRows.map((e) => ({ ...e, paidByName: memberName.get(e.paidBy) ?? "?" })),
    orders: detailOrders,
    settlements: settlementRows.map((s) => ({
      ...s,
      memberName: memberName.get(s.memberId) ?? "?",
    })),
    advances: advanceRows.map((a) => ({ ...a, memberName: memberName.get(a.memberId) ?? "?" })),
    allocations: allocationRows.map((a) => ({
      ...a,
      memberName: a.memberId ? (memberName.get(a.memberId) ?? "?") : null,
    })),
    finance,
    treasurer,
  };
}

/** Semua order belum bayar dari semua batch (untuk halaman Piutang). */
export async function listUnpaidOrders() {
  const [orderRows, customerRows, batchRows] = await Promise.all([
    listOrdersByPaymentStatus("belum"),
    listCustomers(),
    listBatches(),
  ]);
  const customerName = new Map(customerRows.map((c) => [c.id, c.name]));
  const batchDate = new Map(batchRows.map((b) => [b.id, b.date]));
  return orderRows.map((order) => ({
    ...order,
    customerName: customerName.get(order.customerId) ?? "?",
    batchDate: batchDate.get(order.batchId) ?? "?",
    total: orderTotal(order.items),
  }));
}

/** Posisi kas global per anggota (untuk halaman Kas). */
export async function getCashPositions() {
  const [memberRows, paymentRows, settlementRows, advanceRows, batchRows, treasurer] =
    await Promise.all([
      listMembers(),
      listPayments(),
      listSettlements(),
      listAdvances(),
      listBatches(),
      getTreasurer(),
    ]);

  const finance = computeBatchFinance({
    treasurerId: treasurer?.id ?? "",
    expenses: [],
    orders: [],
    payments: paymentRows,
    settlements: settlementRows,
    advances: advanceRows,
    allocations: [],
  });
  const positionByMember = new Map(finance.memberPositions.map((p) => [p.memberId, p]));
  const memberName = new Map(memberRows.map((m) => [m.id, m.name]));
  const batchDate = new Map(batchRows.map((b) => [b.id, b.date]));

  return {
    treasurer,
    treasurerCash: finance.treasurerCash,
    totalUnsettled: finance.totalUnsettled,
    outstandingAdvances: finance.outstandingAdvances,
    members: memberRows.map((m) => ({
      member: m,
      position: positionByMember.get(m.id) ?? {
        memberId: m.id,
        received: 0,
        settledAccepted: 0,
        settledPending: 0,
        outstanding: 0,
      },
    })),
    settlements: settlementRows.map((s) => ({
      ...s,
      memberName: memberName.get(s.memberId) ?? "?",
    })),
    advances: advanceRows.map((a) => ({
      ...a,
      memberName: memberName.get(a.memberId) ?? "?",
      batchDate: batchDate.get(a.batchId) ?? "?",
    })),
  };
}
