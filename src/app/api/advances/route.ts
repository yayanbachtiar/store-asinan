import { NextResponse } from "next/server";
import { z } from "zod";
import { badRequest, guardApi, parseBody } from "@/lib/api";
import { createAdvance } from "@/lib/repo/advances";
import { recordAudit } from "@/lib/repo/audit";

const createSchema = z.object({
  batchId: z.string().min(1),
  memberId: z.string().min(1),
  amount: z.number().int().positive(),
});

export async function POST(request: Request) {
  const guard = await guardApi();
  if ("response" in guard) return guard.response;
  const body = parseBody(createSchema, await request.json().catch(() => null));
  if (!body) return badRequest("Data talangan tidak valid");
  const row = await createAdvance({ ...body, status: "belum_diganti" });
  await recordAudit({
    memberId: guard.member.id,
    action: "create",
    entity: "advances",
    entityId: row.id,
    detail: body,
  });
  return NextResponse.json(row, { status: 201 });
}
