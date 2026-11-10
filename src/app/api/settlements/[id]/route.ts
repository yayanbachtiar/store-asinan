import { NextResponse } from "next/server";
import { z } from "zod";
import { badRequest, guardApi, idParam, parseBody } from "@/lib/api";
import { deleteSettlement, updateSettlement } from "@/lib/repo/settlements";
import type { Settlement } from "@/lib/types";

const patchSchema = z.object({
  amount: z.number().int().positive().optional(),
  status: z.enum(["menunggu", "diterima"]).optional(),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await guardApi();
  if ("response" in guard) return guard.response;
  const id = idParam((await params).id);
  if (!id) return badRequest("ID tidak valid");
  const body = parseBody(patchSchema, await request.json().catch(() => null));
  if (!body) return badRequest("Data tidak valid");

  const values: Partial<Settlement> = { ...body };
  if (body.status === "diterima") values.settledAt = new Date().toISOString();
  if (body.status === "menunggu") values.settledAt = null;
  const row = await updateSettlement(id, values);
  if (!row) return NextResponse.json({ error: "Tidak ditemukan" }, { status: 404 });
  return NextResponse.json(row);
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await guardApi();
  if ("response" in guard) return guard.response;
  const id = idParam((await params).id);
  if (!id) return badRequest("ID tidak valid");
  await deleteSettlement(id);
  return NextResponse.json({ ok: true });
}
