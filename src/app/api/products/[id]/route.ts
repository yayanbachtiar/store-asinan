import { NextResponse } from "next/server";
import { z } from "zod";
import { badRequest, guardApi, idParam, parseBody } from "@/lib/api";
import { findProductByName, updateProduct } from "@/lib/repo/products";

const patchSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  price: z.number().int().positive().optional(),
  isActive: z.boolean().optional(),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await guardApi();
  if ("response" in guard) return guard.response;
  const id = idParam((await params).id);
  if (!id) return badRequest("ID tidak valid");
  const body = parseBody(patchSchema, await request.json().catch(() => null));
  if (!body) return badRequest("Data tidak valid");
  if (body.name) {
    const other = await findProductByName(body.name);
    if (other && other.id !== id) return badRequest("Nama produk sudah ada");
  }
  const row = await updateProduct(id, body);
  if (!row) return NextResponse.json({ error: "Tidak ditemukan" }, { status: 404 });
  return NextResponse.json(row);
}
