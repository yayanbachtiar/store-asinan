import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { orders, payments } from "@/db/schema";
import { badRequest, guardApi, idParam } from "@/lib/api";

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await guardApi();
  if ("response" in guard) return guard.response;
  const id = idParam((await params).id);
  if (!id) return badRequest("ID tidak valid");

  const [payment] = await db.select().from(payments).where(eq(payments.id, id)).limit(1);
  if (!payment) return NextResponse.json({ error: "Tidak ditemukan" }, { status: 404 });
  await db.delete(payments).where(eq(payments.id, id));
  // Bila tidak ada pembayaran lain untuk order ini, kembalikan ke BELUM BAYAR.
  const remaining = await db
    .select()
    .from(payments)
    .where(eq(payments.orderId, payment.orderId))
    .limit(1);
  if (remaining.length === 0) {
    await db.update(orders).set({ paymentStatus: "belum" }).where(eq(orders.id, payment.orderId));
  }
  return NextResponse.json({ ok: true });
}
