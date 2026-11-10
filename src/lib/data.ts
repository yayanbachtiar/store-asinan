import { asc, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import {
  advances,
  batches,
  customers,
  expenses,
  members,
  orderItems,
  orders,
  payments,
  products,
  profitAllocations,
  settlements,
} from "@/db/schema";
import { computeBatchFinance, orderTotal, type BatchFinance } from "./finance";

/**
 * Lapisan baca untuk halaman dashboard. Semua fungsi aman dipanggil saat
 * build / saat DB belum ada: penelepon membungkus dengan try/catch dan
 * menampilkan keadaan kosong (pola skill nextjs_ghcr_deploy).
 */

export type BatchDetail = {
  batch: typeof batches.$inferSelect;
  expenses: (typeof expenses.$inferSelect & { paidByName: string })[];
  orders: (typeof orders.$inferSelect & {
    customerName: string;
    total: number;
    items: (typeof orderItems.$inferSelect)[];
    payment: typeof payments.$inferSelect | null;
  })[];
  settlements: (typeof settlements.$inferSelect & { memberName: string })[];
  advances: (typeof advances.$inferSelect & { memberName: string })[];
  allocations: (typeof profitAllocations.$inferSelect & { memberName: string | null })[];
  finance: BatchFinance;
  treasurer: { id: number; name: string } | null;
};

export async function getTreasurer() {
  const [row] = await db
    .select({ id: members.id, name: members.name })
    .from(members)
    .where(eq(members.role, "bendahara"))
    .limit(1);
  return row ?? null;
}

export async function listMembers() {
  return db.select().from(members).orderBy(asc(members.name));
}

export async function listProducts() {
  return db.select().from(products).orderBy(asc(products.name));
}

export async function listCustomers() {
  return db.select().from(customers).orderBy(asc(customers.name));
}

export async function listBatches() {
  return db.select().from(batches).orderBy(desc(batches.date), desc(batches.id));
}

export async function getBatchDetail(batchId: number): Promise<BatchDetail | null> {
  const [batch] = await db.select().from(batches).where(eq(batches.id, batchId)).limit(1);
  if (!batch) return null;

  const memberRows = await listMembers();
  const memberName = new Map(memberRows.map((m) => [m.id, m.name]));
  const treasurer = await getTreasurer();

  const expenseRows = await db
    .select()
    .from(expenses)
    .where(eq(expenses.batchId, batchId))
    .orderBy(asc(expenses.id));
  const orderRows = await db
    .select({
      order: orders,
      customerName: customers.name,
    })
    .from(orders)
    .innerJoin(customers, eq(orders.customerId, customers.id))
    .where(eq(orders.batchId, batchId))
    .orderBy(asc(orders.id));
  const itemRows = await db
    .select({ item: orderItems })
    .from(orderItems)
    .innerJoin(orders, eq(orderItems.orderId, orders.id))
    .where(eq(orders.batchId, batchId));
  const paymentRows = await db
    .select({ payment: payments })
    .from(payments)
    .innerJoin(orders, eq(payments.orderId, orders.id))
    .where(eq(orders.batchId, batchId));
  const settlementRows = await db
    .select()
    .from(settlements)
    .orderBy(asc(settlements.id));
  const advanceRows = await db
    .select()
    .from(advances)
    .where(eq(advances.batchId, batchId))
    .orderBy(asc(advances.id));
  const allocationRows = await db
    .select()
    .from(profitAllocations)
    .where(eq(profitAllocations.batchId, batchId))
    .orderBy(asc(profitAllocations.id));

  const itemsByOrder = new Map<number, (typeof orderItems.$inferSelect)[]>();
  for (const { item } of itemRows) {
    const list = itemsByOrder.get(item.orderId) ?? [];
    list.push(item);
    itemsByOrder.set(item.orderId, list);
  }
  const paymentByOrder = new Map(paymentRows.map(({ payment }) => [payment.orderId, payment]));

  const detailOrders = orderRows.map(({ order, customerName }) => {
    const items = itemsByOrder.get(order.id) ?? [];
    return {
      ...order,
      customerName,
      total: orderTotal(items),
      items,
      payment: paymentByOrder.get(order.id) ?? null,
    };
  });

  // Setoran tidak terikat batch (uang anggota lintas batch) — posisi kas
  // dihitung global agar tidak dobel antar-batch. Untuk panel batch ini
  // kita tetap pakai seluruh setoran anggota.
  const finance = computeBatchFinance({
    treasurerId: treasurer?.id ?? -1,
    expenses: expenseRows,
    orders: detailOrders,
    payments: paymentRows.map(({ payment }) => payment),
    settlements: settlementRows,
    advances: advanceRows,
    allocations: allocationRows,
  });

  return {
    batch,
    expenses: expenseRows.map((e) => ({ ...e, paidByName: memberName.get(e.paidBy) ?? "?" })),
    orders: detailOrders,
    settlements: settlementRows.map((s) => ({ ...s, memberName: memberName.get(s.memberId) ?? "?" })),
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
  const rows = await db
    .select({ order: orders, customerName: customers.name, batchDate: batches.date })
    .from(orders)
    .innerJoin(customers, eq(orders.customerId, customers.id))
    .innerJoin(batches, eq(orders.batchId, batches.id))
    .where(eq(orders.paymentStatus, "belum"))
    .orderBy(asc(orders.id));
  const itemRows = await db.select().from(orderItems);
  const itemsByOrder = new Map<number, (typeof orderItems.$inferSelect)[]>();
  for (const item of itemRows) {
    const list = itemsByOrder.get(item.orderId) ?? [];
    list.push(item);
    itemsByOrder.set(item.orderId, list);
  }
  return rows.map(({ order, customerName, batchDate }) => ({
    ...order,
    customerName,
    batchDate,
    total: orderTotal(itemsByOrder.get(order.id) ?? []),
  }));
}

/** Posisi kas global per anggota (untuk halaman Kas). */
export async function getCashPositions() {
  const memberRows = await listMembers();
  const paymentRows = await db.select().from(payments);
  const settlementRows = await db.select().from(settlements).orderBy(asc(settlements.id));
  const advanceRows = await db.select().from(advances).orderBy(asc(advances.id));
  const treasurer = await getTreasurer();

  const finance = computeBatchFinance({
    treasurerId: treasurer?.id ?? -1,
    expenses: [],
    orders: [],
    payments: paymentRows,
    settlements: settlementRows,
    advances: advanceRows,
    allocations: [],
  });
  const positionByMember = new Map(finance.memberPositions.map((p) => [p.memberId, p]));
  const memberName = new Map(memberRows.map((m) => [m.id, m.name]));

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
    })),
  };
}
