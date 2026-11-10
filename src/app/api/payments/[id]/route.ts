import { NextResponse } from "next/server";
import { badRequest, guardApi, idParam } from "@/lib/api";
import { updateOrder } from "@/lib/repo/orders";
import { deletePayment, getPayment, listPaymentsByOrder } from "@/lib/repo/payments";

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await guardApi();
  if ("response" in guard) return guard.response;
  const id = idParam((await params).id);
  if (!id) return badRequest("ID tidak valid");

  const payment = await getPayment(id);
  if (!payment) return NextResponse.json({ error: "Tidak ditemukan" }, { status: 404 });
  await deletePayment(id);
  // Bila tidak ada pembayaran lain untuk order ini, kembalikan ke BELUM BAYAR.
  const remaining = await listPaymentsByOrder(payment.orderId);
  if (remaining.length === 0) {
    await updateOrder(payment.orderId, { paymentStatus: "belum" });
  }
  return NextResponse.json({ ok: true });
}
