import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { advances } from "@/db/schema";
import { badRequest, guardApi, idParam, parseBody } from "@/lib/api";

const patchSchema = z.object({
  amount: z.number().int().positive().optional(),
  memberId: z.number().int().positive().optional(),
  status: z.enum(["belum_diganti", "diganti"]).optional(),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await guardApi();
  if ("response" in guard) return guard.response;
  const id = idParam((await params).id);
  if (!id) return badRequest("ID tidak valid");
  const body = parseBody(patchSchema, await request.json().catch(() => null));
  if (!body) return badRequest("Data tidak valid");
  const [row] = await db.update(advances).set(body).where(eq(advances.id, id)).returning();
  if (!row) return NextResponse.json({ error: "Tidak ditemukan" }, { status: 404 });
  return NextResponse.json(row);
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await guardApi();
  if ("response" in guard) return guard.response;
  const id = idParam((await params).id);
  if (!id) return badRequest("ID tidak valid");
  await db.delete(advances).where(eq(advances.id, id));
  return NextResponse.json({ ok: true });
}
