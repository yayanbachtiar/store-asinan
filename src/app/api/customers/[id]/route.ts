import { NextResponse } from "next/server";
import { z } from "zod";
import { badRequest, guardApi, idParam, parseBody } from "@/lib/api";
import { deleteCustomer, updateCustomer } from "@/lib/repo/customers";
import { listOrdersByCustomer } from "@/lib/repo/orders";

const patchSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  note: z.string().trim().max(200).nullable().optional(),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await guardApi();
  if ("response" in guard) return guard.response;
  const id = idParam((await params).id);
  if (!id) return badRequest("ID tidak valid");
  const body = parseBody(patchSchema, await request.json().catch(() => null));
  if (!body) return badRequest("Data tidak valid");
  const row = await updateCustomer(id, body);
  if (!row) return NextResponse.json({ error: "Tidak ditemukan" }, { status: 404 });
  return NextResponse.json(row);
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await guardApi();
  if ("response" in guard) return guard.response;
  const id = idParam((await params).id);
  if (!id) return badRequest("ID tidak valid");
  // Firestore tidak punya foreign key: cegah hapus pelanggan yang punya order
  // secara eksplisit di sini (pengganti constraint database lama).
  const orders = await listOrdersByCustomer(id);
  if (orders.length > 0) {
    return badRequest("Pelanggan yang sudah punya order tidak bisa dihapus");
  }
  await deleteCustomer(id);
  return NextResponse.json({ ok: true });
}
