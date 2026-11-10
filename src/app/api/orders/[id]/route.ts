import { NextResponse } from "next/server";
import { z } from "zod";
import { badRequest, guardApi, idParam, parseBody } from "@/lib/api";
import { snapshotItems } from "@/lib/orders";
import { deleteOrder, getOrder, updateOrder } from "@/lib/repo/orders";
import { deletePayment, listPaymentsByOrder } from "@/lib/repo/payments";

const patchSchema = z.object({
  customerId: z.string().min(1).optional(),
  source: z.enum(["wa", "langsung", "puskesmas"]).optional(),
  items: z
    .array(z.object({ productId: z.string().min(1), qty: z.number().int().positive() }))
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
  const patch: Parameters<typeof updateOrder>[1] = { ...fields };
  if (items) {
    try {
      patch.items = await snapshotItems(items);
    } catch (e) {
      return badRequest(e instanceof Error ? e.message : "Produk tidak valid");
    }
  }
  const row = await updateOrder(id, patch);
  if (!row) return NextResponse.json({ error: "Tidak ditemukan" }, { status: 404 });
  return NextResponse.json(row);
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await guardApi();
  if ("response" in guard) return guard.response;
  const id = idParam((await params).id);
  if (!id) return badRequest("ID tidak valid");
  const existing = await getOrder(id);
  if (!existing) return NextResponse.json({ error: "Tidak ditemukan" }, { status: 404 });
  // Firestore tidak punya cascade: pembayaran milik order ini ikut dihapus.
  for (const payment of await listPaymentsByOrder(id)) {
    await deletePayment(payment.id);
  }
  await deleteOrder(id);
  return NextResponse.json({ ok: true });
}
