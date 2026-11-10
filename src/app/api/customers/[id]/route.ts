import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { customers } from "@/db/schema";
import { badRequest, guardApi, idParam, parseBody } from "@/lib/api";

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
  const [row] = await db.update(customers).set(body).where(eq(customers.id, id)).returning();
  if (!row) return NextResponse.json({ error: "Tidak ditemukan" }, { status: 404 });
  return NextResponse.json(row);
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await guardApi();
  if ("response" in guard) return guard.response;
  const id = idParam((await params).id);
  if (!id) return badRequest("ID tidak valid");
  try {
    await db.delete(customers).where(eq(customers.id, id));
  } catch {
    return badRequest("Pelanggan yang sudah punya order tidak bisa dihapus");
  }
  return NextResponse.json({ ok: true });
}
