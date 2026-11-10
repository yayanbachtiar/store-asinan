import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Firestore } from "firebase-admin/firestore";
import { setFirestoreForTests } from "@/lib/db";
import { getBatchDetail, getCashPositions } from "@/lib/data";
import { createAdvance } from "@/lib/repo/advances";
import { createBatch } from "@/lib/repo/batches";
import { createCustomer, deleteCustomer, listCustomers, updateCustomer } from "@/lib/repo/customers";
import { createExpense } from "@/lib/repo/expenses";
import {
  createMember,
  findMemberByEmail,
  getTreasurer,
  listMembers,
  updateMember,
} from "@/lib/repo/members";
import { createOrder, updateOrder } from "@/lib/repo/orders";
import { createPayment, listPaymentsByBatch } from "@/lib/repo/payments";
import { listProducts, seedProducts } from "@/lib/repo/products";
import { createSettlement, updateSettlement } from "@/lib/repo/settlements";
import { FakeFirestore } from "./firestore-fake";

/**
 * Uji lapisan repository + lapisan baca di atas FAKE Firestore in-memory
 * (tests/firestore-fake.ts) — bukan Firestore asli, bukan emulator.
 * Tujuannya: membuktikan CRUD inti dan bahwa ringkasan batch yang dirangkai
 * dari dokumen Firestore menghasilkan angka finance yang persis sama
 * dengan fixture laporan 10 November 2026.
 */

beforeAll(() => {
  setFirestoreForTests(new FakeFirestore() as unknown as Firestore);
});

afterAll(() => {
  setFirestoreForTests(null);
});

describe("repository: CRUD inti", () => {
  it("member: buat, cari by email (whitelist), ubah, urut nama", async () => {
    const budi = await createMember({
      name: "Budi",
      email: "budi@example.com",
      telegramId: null,
      role: "anggota",
      isActive: true,
    });
    expect(budi.id).toBeTruthy();
    expect((await findMemberByEmail("BUDI@example.com"))?.id).toBe(budi.id);
    const updated = await updateMember(budi.id, { name: "Budi Santoso" });
    expect(updated?.name).toBe("Budi Santoso");
    const all = await listMembers();
    expect(all.map((m) => m.name)).toContain("Budi Santoso");
  });

  it("pelanggan: buat, ubah, hapus", async () => {
    const c = await createCustomer({ name: "Pelanggan Uji", note: null, createdBy: null });
    const updated = await updateCustomer(c.id, { note: "Puskesmas" });
    expect(updated?.note).toBe("Puskesmas");
    await deleteCustomer(c.id);
    expect((await listCustomers()).find((x) => x.id === c.id)).toBeUndefined();
  });

  it("seed produk idempoten: Cup Kecil 10.000 & Cup Besar 20.000", async () => {
    await seedProducts();
    await seedProducts();
    const products = await listProducts();
    expect(products).toHaveLength(2);
    expect(products.find((p) => p.name === "Cup Kecil")?.price).toBe(10_000);
    expect(products.find((p) => p.name === "Cup Besar")?.price).toBe(20_000);
  });
});

describe("repository: fixture laporan 10 November 2026", () => {
  it("ringkasan batch dari dokumen Firestore = angka laporan manual", async () => {
    const wening = await createMember({
      name: "Wening",
      email: "wening@example.com",
      telegramId: null,
      role: "bendahara",
      isActive: true,
    });
    const memberA = await createMember({
      name: "Anggota A",
      email: "a@example.com",
      telegramId: null,
      role: "anggota",
      isActive: true,
    });
    const memberB = await createMember({
      name: "Anggota B",
      email: "b@example.com",
      telegramId: null,
      role: "anggota",
      isActive: true,
    });
    expect((await getTreasurer())?.id).toBe(wening.id);

    const products = await listProducts();
    const kecil = products.find((p) => p.name === "Cup Kecil")!;
    const besar = products.find((p) => p.name === "Cup Besar")!;

    const batch = await createBatch({
      date: "2026-11-10",
      title: "Batch 10 Nov",
      status: "aktif",
      initialCapital: 165_000,
      createdBy: wening.id,
    });

    // Pengeluaran Rp215.000
    for (const [description, amount] of [
      ["Gula dan lombok", 60_000],
      ["Jeruk nipis", 10_000],
      ["Nanas dan bengkoang", 90_000],
      ["Wadah kemasan (thinwall)", 55_000],
    ] as const) {
      await createExpense({
        batchId: batch.id,
        description,
        amount,
        paidBy: wening.id,
        createdVia: "dashboard",
      });
    }

    const customerIds = new Map<string, string>();
    async function customer(name: string): Promise<string> {
      const existing = customerIds.get(name);
      if (existing) return existing;
      const row = await createCustomer({ name, note: null, createdBy: wening.id });
      customerIds.set(name, row.id);
      return row.id;
    }

    type ItemSpec = { product: typeof kecil; qty: number };
    async function order(name: string, items: ItemSpec[], paidTo?: string, method: "cash" | "transfer" = "cash") {
      const row = await createOrder({
        batchId: batch.id,
        customerId: await customer(name),
        recordedBy: wening.id,
        source: "wa",
        paymentStatus: "belum",
        createdVia: "dashboard",
        items: items.map((i) => ({
          productId: i.product.id,
          productNameSnapshot: i.product.name,
          priceSnapshot: i.product.price,
          qty: i.qty,
        })),
      });
      if (paidTo) {
        const total = row.items.reduce((s, i) => s + i.priceSnapshot * i.qty, 0);
        await createPayment({
          orderId: row.id,
          batchId: row.batchId, // denormalisasi, sama seperti route API
          amount: total,
          method,
          receivedBy: paidTo,
          paidAt: new Date().toISOString(),
        });
        await updateOrder(row.id, { paymentStatus: "sudah" });
      }
      return row;
    }

    // Belum bayar — piutang Rp110.000
    await order("Karin", [{ product: kecil, qty: 1 }]);
    await order("Mb Riska", [{ product: kecil, qty: 1 }]);
    await order("Iyut", [{ product: kecil, qty: 1 }]);
    await order("Drg. Dewi", [{ product: kecil, qty: 4 }]);
    await order("Bu Erna", [{ product: kecil, qty: 2 }]);
    await order("Tika", [{ product: kecil, qty: 1 }]);
    await order("Mba Puput", [{ product: kecil, qty: 1 }]);
    // Sudah bayar, diterima bendahara langsung — cash Rp80.000
    await order("Rara", [{ product: kecil, qty: 1 }], wening.id);
    await order("Bu Yanti", [{ product: besar, qty: 1 }], wening.id);
    await order("Bu Norma", [{ product: besar, qty: 1 }], wening.id);
    await order("Bu Titi", [{ product: kecil, qty: 3 }], wening.id);
    // Sudah bayar transfer ke bendahara — Rp40.000
    await order("Dr. Ami", [{ product: besar, qty: 2 }], wening.id, "transfer");
    // Sudah bayar, masih di tangan anggota lain — belum setor Rp70.000
    await order("Bu Eni", [{ product: kecil, qty: 1 }, { product: besar, qty: 1 }], memberA.id);
    await order("Bulik Yani", [{ product: kecil, qty: 2 }], memberA.id);
    await order("Bu Arry", [{ product: besar, qty: 1 }], memberB.id);

    await createAdvance({
      batchId: batch.id,
      memberId: memberA.id,
      amount: 50_000,
      status: "belum_diganti",
    });

    // Pembayaran terbaca per batch berkat denormalisasi batchId.
    expect(await listPaymentsByBatch(batch.id)).toHaveLength(8);

    const detail = await getBatchDetail(batch.id);
    expect(detail).not.toBeNull();
    const f = detail!.finance;
    expect(f.totalExpenses).toBe(215_000);
    expect(f.omzet).toBe(300_000);
    expect(f.profit).toBe(85_000);
    expect(f.roiOnCostPct).toBe(39.53);
    expect(f.marginOnRevenuePct).toBe(28.33);
    expect(f.totalReceivable).toBe(110_000);
    expect(f.totalPaid).toBe(190_000);
    expect(f.treasurerCash).toBe(120_000);
    expect(f.totalUnsettled).toBe(70_000);
    expect(f.reconciliationDiff).toBe(0);
    expect(f.outstandingAdvances).toBe(50_000);
    // Item tertanam terbaca dari dokumen order.
    const buEni = detail!.orders.find((o) => o.customerName === "Bu Eni");
    expect(buEni?.items).toHaveLength(2);
    expect(buEni?.total).toBe(30_000);

    // Setoran diterima: kas bendahara naik, belum-setor turun (bayar ≠ setor).
    const settlement = await createSettlement({
      memberId: memberA.id,
      receivedBy: wening.id,
      amount: 50_000,
      status: "menunggu",
      settledAt: null,
    });
    await updateSettlement(settlement.id, {
      status: "diterima",
      settledAt: new Date().toISOString(),
    });
    const positions = await getCashPositions();
    expect(positions.treasurerCash).toBe(170_000);
    expect(positions.totalUnsettled).toBe(20_000);
  });
});
