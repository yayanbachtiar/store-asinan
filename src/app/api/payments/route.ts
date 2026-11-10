import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { auditLog, orders, payments } from "@/db/schema";
import { badRequest, guardApi, parseBody } from "@/lib/api";

const createSchema = z.object({
  orderId: z.number().int().positive(),
  amount: z.number().int().positive(),
  method: z.enum(["cash", "transfer"]),
  receivedBy: z.number().int().positive(),
});

export async function POST(request: Request) {
  const guard = await guardApi();
  if ("response" in guard) return guard.response;
  const body = parseBody(createSchema, await request.json().catch(() => null));
  if (!body) return badRequest("Data pembayaran tidak valid");

  const [order] = await db.select().from(orders).where(eq(orders.id, body.orderId)).limit(1);
  if (!order) return NextResponse.json({ error: "Order tidak ditemukan" }, { status: 404 });

  const [row] = await db.insert(payments).values(body).returning();
  // Mencatat pembayaran otomatis menandai order SUDAH BAYAR.
  await db.update(orders).set({ paymentStatus: "sudah" }).where(eq(orders.id, body.orderId));
  await db.insert(auditLog).values({
    memberId: guard.member.id,
    action: "create",
    entity: "payments",
    entityId: row.id,
    detail: body,
  });
  return NextResponse.json(row, { status: 201 });
}
