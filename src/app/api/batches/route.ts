import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { auditLog, batches } from "@/db/schema";
import { badRequest, guardApi, parseBody } from "@/lib/api";

const createSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal harus YYYY-MM-DD"),
  title: z.string().trim().max(120).optional(),
  initialCapital: z.number().int().min(0).default(0),
});

export async function POST(request: Request) {
  const guard = await guardApi();
  if ("response" in guard) return guard.response;
  const body = parseBody(createSchema, await request.json().catch(() => null));
  if (!body) return badRequest("Data batch tidak valid");

  const [row] = await db
    .insert(batches)
    .values({
      date: body.date,
      title: body.title || null,
      initialCapital: body.initialCapital,
      createdBy: guard.member.id,
    })
    .returning();
  await db.insert(auditLog).values({
    memberId: guard.member.id,
    action: "create",
    entity: "batches",
    entityId: row.id,
    detail: body,
  });
  return NextResponse.json(row, { status: 201 });
}
