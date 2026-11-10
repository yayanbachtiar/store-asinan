import { NextResponse } from "next/server";
import { z } from "zod";
import { badRequest, guardApi, parseBody } from "@/lib/api";
import { recordAudit } from "@/lib/repo/audit";
import { createExpense } from "@/lib/repo/expenses";

const createSchema = z.object({
  batchId: z.string().min(1),
  description: z.string().trim().min(1).max(200),
  amount: z.number().int().positive(),
  paidBy: z.string().min(1),
});

export async function POST(request: Request) {
  const guard = await guardApi();
  if ("response" in guard) return guard.response;
  const body = parseBody(createSchema, await request.json().catch(() => null));
  if (!body) return badRequest("Data pengeluaran tidak valid");

  const row = await createExpense({ ...body, createdVia: "dashboard" });
  await recordAudit({
    memberId: guard.member.id,
    action: "create",
    entity: "expenses",
    entityId: row.id,
    detail: body,
  });
  return NextResponse.json(row, { status: 201 });
}
