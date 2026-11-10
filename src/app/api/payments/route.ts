import { NextResponse } from "next/server";
import { z } from "zod";
import { badRequest, guardApi, parseBody } from "@/lib/api";
import { recordAudit } from "@/lib/repo/audit";
import { getOrder, updateOrder } from "@/lib/repo/orders";
import { createPayment } from "@/lib/repo/payments";

const createSchema = z.object({
  orderId: z.string().min(1),
  amount: z.number().int().positive(),
  method: z.enum(["cash", "transfer"]),
  receivedBy: z.string().min(1),
});

export async function POST(request: Request) {
  const guard = await guardApi();
  if ("response" in guard) return guard.response;
  const body = parseBody(createSchema, await request.json().catch(() => null));
  if (!body) return badRequest("Data pembayaran tidak valid");

  const order = await getOrder(body.orderId);
  if (!order) return NextResponse.json({ error: "Order tidak ditemukan" }, { status: 404 });

  const now = new Date().toISOString();
  const row = await createPayment({
    orderId: body.orderId,
    // Denormalisasi batchId dari order agar query per batch praktis.
    batchId: order.batchId,
    amount: body.amount,
    method: body.method,
    receivedBy: body.receivedBy,
    paidAt: now,
  });
  // Mencatat pembayaran otomatis menandai order SUDAH BAYAR.
  // (Status BAYAR di sini; status SETOR urusan settlements — dua hal berbeda.)
  await updateOrder(body.orderId, { paymentStatus: "sudah" });
  await recordAudit({
    memberId: guard.member.id,
    action: "create",
    entity: "payments",
    entityId: row.id,
    detail: body,
  });
  return NextResponse.json(row, { status: 201 });
}
