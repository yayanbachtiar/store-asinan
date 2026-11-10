import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { auditLog, members, settlements } from "@/db/schema";
import { badRequest, guardApi, parseBody } from "@/lib/api";

const createSchema = z.object({
  memberId: z.number().int().positive(),
  amount: z.number().int().positive(),
});

export async function POST(request: Request) {
  const guard = await guardApi();
  if ("response" in guard) return guard.response;
  const body = parseBody(createSchema, await request.json().catch(() => null));
  if (!body) return badRequest("Data setoran tidak valid");

  const [treasurer] = await db
    .select()
    .from(members)
    .where(eq(members.role, "bendahara"))
    .limit(1);
  if (!treasurer) return badRequest("Belum ada anggota berperan bendahara");

  const [row] = await db
    .insert(settlements)
    .values({ memberId: body.memberId, amount: body.amount, receivedBy: treasurer.id })
    .returning();
  await db.insert(auditLog).values({
    memberId: guard.member.id,
    action: "create",
    entity: "settlements",
    entityId: row.id,
    detail: body,
  });
  return NextResponse.json(row, { status: 201 });
}
