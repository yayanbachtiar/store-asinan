import { NextResponse } from "next/server";
import { z } from "zod";
import { badRequest, guardApi, idParam, parseBody } from "@/lib/api";
import { deleteAdvance, updateAdvance } from "@/lib/repo/advances";

const patchSchema = z.object({
  amount: z.number().int().positive().optional(),
  memberId: z.string().min(1).optional(),
  status: z.enum(["belum_diganti", "diganti"]).optional(),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await guardApi();
  if ("response" in guard) return guard.response;
  const id = idParam((await params).id);
  if (!id) return badRequest("ID tidak valid");
  const body = parseBody(patchSchema, await request.json().catch(() => null));
  if (!body) return badRequest("Data tidak valid");
  const row = await updateAdvance(id, body);
  if (!row) return NextResponse.json({ error: "Tidak ditemukan" }, { status: 404 });
  return NextResponse.json(row);
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await guardApi();
  if ("response" in guard) return guard.response;
  const id = idParam((await params).id);
  if (!id) return badRequest("ID tidak valid");
  await deleteAdvance(id);
  return NextResponse.json({ ok: true });
}
