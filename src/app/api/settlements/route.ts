import { NextResponse } from "next/server";
import { z } from "zod";
import { badRequest, guardApi, parseBody } from "@/lib/api";
import { recordAudit } from "@/lib/repo/audit";
import { getTreasurer } from "@/lib/repo/members";
import { createSettlement } from "@/lib/repo/settlements";

const createSchema = z.object({
  memberId: z.string().min(1),
  amount: z.number().int().positive(),
});

export async function POST(request: Request) {
  const guard = await guardApi();
  if ("response" in guard) return guard.response;
  const body = parseBody(createSchema, await request.json().catch(() => null));
  if (!body) return badRequest("Data setoran tidak valid");

  const treasurer = await getTreasurer();
  if (!treasurer) return badRequest("Belum ada anggota berperan bendahara");

  const row = await createSettlement({
    memberId: body.memberId,
    amount: body.amount,
    receivedBy: treasurer.id,
    status: "menunggu",
    settledAt: null,
  });
  await recordAudit({
    memberId: guard.member.id,
    action: "create",
    entity: "settlements",
    entityId: row.id,
    detail: body,
  });
  return NextResponse.json(row, { status: 201 });
}
