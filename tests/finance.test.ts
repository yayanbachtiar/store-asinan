import { describe, expect, it } from "vitest";
import {
  computeBatchFinance,
  groupReceivables,
  orderTotal,
  validateAllocations,
  type BatchFinanceInput,
} from "@/lib/finance";

/**
 * FIXTURE SINTETIS rekonstruksi laporan penjualan asinan 10 November 2026.
 * Angka totalnya nyata (dari laporan manual tim), tetapi susunan
 * received_by per pembayaran adalah rekonstruksi untuk menguji matematika
 * rekonsiliasi: pembayaran yang diterima bendahara (Wening) diatur
 * cash Rp80.000 + transfer Dr. Ami Rp40.000 = kas Rp120.000, dan sisa
 * Rp70.000 berada di tangan anggota lain (belum disetor).
 */
const TREASURER = "member-wening"; // Wening — bendahara (ID dokumen Firestore = string)
const MEMBER_A = "member-a";
const MEMBER_B = "member-b";

let nextOrderId = 1;
function order(customerName: string, total: number, paidTo?: string) {
  const id = `order-${nextOrderId++}`;
  return {
    orderRow: { id, customerName, total, paymentStatus: (paidTo ? "sudah" : "belum") as "sudah" | "belum" },
    payment: paidTo ? { orderId: id, amount: total, receivedBy: paidTo } : null,
  };
}

function fixture10Nov(): BatchFinanceInput {
  nextOrderId = 1;
  const rows = [
    // Belum bayar (piutang)
    order("Karin", 10_000),
    order("Mb Riska", 10_000),
    order("Iyut", 10_000),
    order("Drg. Dewi", 40_000),
    order("Bu Erna", 20_000),
    order("Tika", 10_000),
    order("Mba Puput", 10_000),
    // Sudah bayar — diterima bendahara langsung (cash Rp80.000)
    order("Rara", 10_000, TREASURER),
    order("Bu Yanti", 20_000, TREASURER),
    order("Bu Norma", 20_000, TREASURER),
    order("Bu Titi", 30_000, TREASURER),
    // Sudah bayar — transfer, diterima bendahara (Rp40.000)
    order("Dr. Ami", 40_000, TREASURER),
    // Sudah bayar — masih di tangan anggota lain (belum setor, Rp70.000)
    order("Bu Eni", 30_000, MEMBER_A),
    order("Bulik Yani", 20_000, MEMBER_A),
    order("Bu Arry", 20_000, MEMBER_B),
  ];
  return {
    treasurerId: TREASURER,
    expenses: [
      { amount: 60_000 }, // gula dan lombok
      { amount: 10_000 }, // jeruk nipis
      { amount: 90_000 }, // nanas dan bengkoang
      { amount: 55_000 }, // wadah kemasan (thinwall)
    ],
    orders: rows.map((r) => r.orderRow),
    payments: rows.flatMap((r) => (r.payment ? [r.payment] : [])),
    settlements: [],
    advances: [{ memberId: MEMBER_A, amount: 50_000, status: "belum_diganti" }],
    allocations: [],
  };
}

describe("fixture laporan 10 November 2026", () => {
  const f = computeBatchFinance(fixture10Nov());

  it("total pengeluaran Rp215.000", () => {
    expect(f.totalExpenses).toBe(215_000);
  });

  it("omzet Rp300.000 dan laba Rp85.000", () => {
    expect(f.omzet).toBe(300_000);
    expect(f.profit).toBe(85_000);
  });

  it("ROI atas biaya 39,53% dan margin atas omzet 28,33%", () => {
    expect(f.roiOnCostPct).toBe(39.53);
    expect(f.marginOnRevenuePct).toBe(28.33);
  });

  it("piutang Rp110.000 dan total dibayar Rp190.000", () => {
    expect(f.totalReceivable).toBe(110_000);
    expect(f.totalPaid).toBe(190_000);
  });

  it("rekonsiliasi: omzet = kas 120rb + belum setor 70rb + piutang 110rb", () => {
    expect(f.treasurerCash).toBe(120_000);
    expect(f.totalUnsettled).toBe(70_000);
    expect(f.totalReceivable).toBe(110_000);
    expect(f.treasurerCash + f.totalUnsettled + f.totalReceivable).toBe(f.omzet);
    expect(f.reconciliationDiff).toBe(0);
  });

  it("posisi per anggota: yang belum setor terpisah per orang", () => {
    const a = f.memberPositions.find((p) => p.memberId === MEMBER_A);
    const b = f.memberPositions.find((p) => p.memberId === MEMBER_B);
    expect(a?.received).toBe(50_000);
    expect(a?.outstanding).toBe(50_000);
    expect(b?.outstanding).toBe(20_000);
  });

  it("talangan belum diganti Rp50.000", () => {
    expect(f.outstandingAdvances).toBe(50_000);
  });
});

describe("setoran mengubah posisi (bayar ≠ setor)", () => {
  it("setoran diterima mengurangi belum-setor dan menambah kas bendahara", () => {
    const input = fixture10Nov();
    input.settlements = [{ memberId: MEMBER_A, amount: 50_000, status: "diterima" }];
    const f = computeBatchFinance(input);
    expect(f.totalUnsettled).toBe(20_000);
    expect(f.treasurerCash).toBe(170_000);
    expect(f.reconciliationDiff).toBe(0);
  });

  it("setoran yang masih menunggu TIDAK mengubah kas maupun posisi", () => {
    const input = fixture10Nov();
    input.settlements = [{ memberId: MEMBER_A, amount: 50_000, status: "menunggu" }];
    const f = computeBatchFinance(input);
    expect(f.totalUnsettled).toBe(70_000);
    expect(f.treasurerCash).toBe(120_000);
    const a = f.memberPositions.find((p) => p.memberId === MEMBER_A);
    expect(a?.settledPending).toBe(50_000);
  });
});

describe("validasi alokasi laba", () => {
  it("Σ alokasi wajib = laba", () => {
    const ok = validateAllocations(85_000, [
      { kind: "diputar", amount: 50_000 },
      { kind: "ditahan", amount: 35_000 },
    ]);
    expect(ok).toEqual({ ok: true, total: 85_000, diff: 0 });

    const kurang = validateAllocations(85_000, [{ kind: "dibagi", memberId: TREASURER, amount: 17_000 }]);
    expect(kurang.ok).toBe(false);
    expect(kurang.diff).toBe(-68_000);

    const lebih = validateAllocations(85_000, [{ kind: "ditahan", amount: 90_000 }]);
    expect(lebih.ok).toBe(false);
    expect(lebih.diff).toBe(5_000);
  });
});

describe("pembantu lain", () => {
  it("orderTotal memakai harga snapshot × qty", () => {
    expect(
      orderTotal([
        { priceSnapshot: 10_000, qty: 1 },
        { priceSnapshot: 20_000, qty: 2 },
      ]),
    ).toBe(50_000);
  });

  it("groupReceivables mengelompokkan piutang per pelanggan", () => {
    const groups = groupReceivables([
      { id: "o1", customerName: "Drg. Dewi", total: 40_000, paymentStatus: "belum" as const },
      { id: "o2", customerName: "Karin", total: 10_000, paymentStatus: "belum" as const },
      { id: "o3", customerName: "Karin", total: 10_000, paymentStatus: "sudah" as const },
    ]);
    expect(groups).toHaveLength(2);
    expect(groups[0]).toMatchObject({ customerName: "Drg. Dewi", total: 40_000 });
    expect(groups.reduce((s, g) => s + g.total, 0)).toBe(50_000);
  });
});
