import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { advances, auditLog } from "@/db/schema";
import { badRequest, guardApi, parseBody } from "@/lib/api";

const createSchema = z.object({
  batchId: z.number().int().positive(),
  memberId: z.number().int().positive(),
  amount: z.number().int().positive(),
});

export async function POST(request: Request) {
  const guard = await guardApi();
  if ("response" in guard) return guard.response;
  const body = parseBody(createSchema, await request.json().catch(() => null));
  if (!body) return badRequest("Data talangan tidak valid");
  const [row] = await db.insert(advances).values(body).returning();
  await db.insert(auditLog).values({
    memberId: guard.member.id,
    action: "create",
    entity: "advances",
    entityId: row.id,
    detail: body,
  });
  return NextResponse.json(row, { status: 201 });
}
