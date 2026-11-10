import { NextResponse } from "next/server";
import { z } from "zod";
import { badRequest, guardApi, parseBody } from "@/lib/api";
import { recordAudit } from "@/lib/repo/audit";
import { createBatch } from "@/lib/repo/batches";

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

  const row = await createBatch({
    date: body.date,
    title: body.title || null,
    status: "aktif",
    initialCapital: body.initialCapital,
    createdBy: guard.member.id,
  });
  await recordAudit({
    memberId: guard.member.id,
    action: "create",
    entity: "batches",
    entityId: row.id,
    detail: body,
  });
  return NextResponse.json(row, { status: 201 });
}
