import { NextResponse } from "next/server";
import { z } from "zod";
import { badRequest, guardApi, idParam, parseBody } from "@/lib/api";
import { deleteExpense, updateExpense } from "@/lib/repo/expenses";

const patchSchema = z.object({
  description: z.string().trim().min(1).max(200).optional(),
  amount: z.number().int().positive().optional(),
  paidBy: z.string().min(1).optional(),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await guardApi();
  if ("response" in guard) return guard.response;
  const id = idParam((await params).id);
  if (!id) return badRequest("ID tidak valid");
  const body = parseBody(patchSchema, await request.json().catch(() => null));
  if (!body) return badRequest("Data tidak valid");
  const row = await updateExpense(id, body);
  if (!row) return NextResponse.json({ error: "Tidak ditemukan" }, { status: 404 });
  return NextResponse.json(row);
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await guardApi();
  if ("response" in guard) return guard.response;
  const id = idParam((await params).id);
  if (!id) return badRequest("ID tidak valid");
  await deleteExpense(id);
  return NextResponse.json({ ok: true });
}
