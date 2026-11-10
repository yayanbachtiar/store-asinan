import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { auditLog, orderItems, orders } from "@/db/schema";
import { badRequest, guardApi, parseBody } from "@/lib/api";
import { snapshotItems } from "@/lib/orders";

const itemSchema = z.object({
  productId: z.number().int().positive(),
  qty: z.number().int().positive(),
});

const orderBodySchema = z.object({
  batchId: z.number().int().positive(),
  customerId: z.number().int().positive(),
  source: z.enum(["wa", "langsung", "puskesmas"]).default("wa"),
  items: z.array(itemSchema).min(1, "Order harus punya minimal 1 item"),
});

export async function POST(request: Request) {
  const guard = await guardApi();
  if ("response" in guard) return guard.response;
  const body = parseBody(orderBodySchema, await request.json().catch(() => null));
  if (!body) return badRequest("Data order tidak valid");

  let items;
  try {
    items = await snapshotItems(body.items);
  } catch (e) {
    return badRequest(e instanceof Error ? e.message : "Produk tidak valid");
  }

  const [order] = await db
    .insert(orders)
    .values({
      batchId: body.batchId,
      customerId: body.customerId,
      recordedBy: guard.member.id,
      source: body.source,
    })
    .returning();
  await db.insert(orderItems).values(items.map((i) => ({ ...i, orderId: order.id })));
  await db.insert(auditLog).values({
    memberId: guard.member.id,
    action: "create",
    entity: "orders",
    entityId: order.id,
    detail: body,
  });
  return NextResponse.json(order, { status: 201 });
}
