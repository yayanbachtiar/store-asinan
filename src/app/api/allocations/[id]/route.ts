import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { profitAllocations } from "@/db/schema";
import { badRequest, guardApi, idParam } from "@/lib/api";

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await guardApi();
  if ("response" in guard) return guard.response;
  const id = idParam((await params).id);
  if (!id) return badRequest("ID tidak valid");
  await db.delete(profitAllocations).where(eq(profitAllocations.id, id));
  return NextResponse.json({ ok: true });
}
