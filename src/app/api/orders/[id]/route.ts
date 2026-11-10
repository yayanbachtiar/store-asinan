import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { orderItems, orders } from "@/db/schema";
import { badRequest, guardApi, idParam, parseBody } from "@/lib/api";
import { snapshotItems } from "@/lib/orders";

const patchSchema = z.object({
  customerId: z.number().int().positive().optional(),
  source: z.enum(["wa", "langsung", "puskesmas"]).optional(),
  items: z
    .array(z.object({ productId: z.number().int().positive(), qty: z.number().int().positive() }))
    .min(1)
    .optional(),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await guardApi();
  if ("response" in guard) return guard.response;
  const id = idParam((await params).id);
  if (!id) return badRequest("ID tidak valid");
  const body = parseBody(patchSchema, await request.json().catch(() => null));
  if (!body) return badRequest("Data tidak valid");

  const { items, ...fields } = body;
  if (Object.keys(fields).length > 0) {
    await db.update(orders).set(fields).where(eq(orders.id, id));
  }
  if (items) {
    let snapshots;
    try {
      snapshots = await snapshotItems(items);
    } catch (e) {
      return badRequest(e instanceof Error ? e.message : "Produk tidak valid");
    }
    await db.delete(orderItems).where(eq(orderItems.orderId, id));
    await db.insert(orderItems).values(snapshots.map((i) => ({ ...i, orderId: id })));
  }
  const [row] = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
  if (!row) return NextResponse.json({ error: "Tidak ditemukan" }, { status: 404 });
  return NextResponse.json(row);
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await guardApi();
  if ("response" in guard) return guard.response;
  const id = idParam((await params).id);
  if (!id) return badRequest("ID tidak valid");
  await db.delete(orders).where(eq(orders.id, id));
  return NextResponse.json({ ok: true });
}
