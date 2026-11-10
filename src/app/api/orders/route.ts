import { NextResponse } from "next/server";
import { z } from "zod";
import { badRequest, guardApi, parseBody } from "@/lib/api";
import { snapshotItems } from "@/lib/orders";
import { recordAudit } from "@/lib/repo/audit";
import { createOrder } from "@/lib/repo/orders";

const itemSchema = z.object({
  productId: z.string().min(1),
  qty: z.number().int().positive(),
});

const orderBodySchema = z.object({
  batchId: z.string().min(1),
  customerId: z.string().min(1),
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

  // Item disimpan TERTANAM di dokumen order (array items) — atomik, tanpa
  // collection order_items terpisah.
  const order = await createOrder({
    batchId: body.batchId,
    customerId: body.customerId,
    recordedBy: guard.member.id,
    source: body.source,
    paymentStatus: "belum",
    createdVia: "dashboard",
    items,
  });
  await recordAudit({
    memberId: guard.member.id,
    action: "create",
    entity: "orders",
    entityId: order.id,
    detail: body,
  });
  return NextResponse.json(order, { status: 201 });
}
