import { NextResponse } from "next/server";
import { z } from "zod";
import { badRequest, guardApi, parseBody } from "@/lib/api";
import { createAllocation } from "@/lib/repo/allocations";
import { recordAudit } from "@/lib/repo/audit";

const createSchema = z.object({
  batchId: z.string().min(1),
  kind: z.enum(["ditahan", "diputar", "dibagi"]),
  memberId: z.string().min(1).nullable().optional(),
  amount: z.number().int().positive(),
  note: z.string().trim().max(200).optional(),
});

export async function POST(request: Request) {
  const guard = await guardApi();
  if ("response" in guard) return guard.response;
  const body = parseBody(createSchema, await request.json().catch(() => null));
  if (!body) return badRequest("Data alokasi tidak valid");
  if (body.kind === "dibagi" && !body.memberId) {
    return badRequest("Alokasi 'dibagi' wajib memilih anggota penerima");
  }
  const row = await createAllocation({
    batchId: body.batchId,
    kind: body.kind,
    memberId: body.kind === "dibagi" ? body.memberId! : null,
    amount: body.amount,
    note: body.note || null,
    decidedAt: new Date().toISOString(),
  });
  await recordAudit({
    memberId: guard.member.id,
    action: "create",
    entity: "profit_allocations",
    entityId: row.id,
    detail: body,
  });
  return NextResponse.json(row, { status: 201 });
}
