import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { auditLog, expenses } from "@/db/schema";
import { badRequest, guardApi, parseBody } from "@/lib/api";

const createSchema = z.object({
  batchId: z.number().int().positive(),
  description: z.string().trim().min(1).max(200),
  amount: z.number().int().positive(),
  paidBy: z.number().int().positive(),
});

export async function POST(request: Request) {
  const guard = await guardApi();
  if ("response" in guard) return guard.response;
  const body = parseBody(createSchema, await request.json().catch(() => null));
  if (!body) return badRequest("Data pengeluaran tidak valid");

  const [row] = await db.insert(expenses).values(body).returning();
  await db.insert(auditLog).values({
    memberId: guard.member.id,
    action: "create",
    entity: "expenses",
    entityId: row.id,
    detail: body,
  });
  return NextResponse.json(row, { status: 201 });
}
