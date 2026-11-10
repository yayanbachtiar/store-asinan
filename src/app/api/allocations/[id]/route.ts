import { NextResponse } from "next/server";
import { badRequest, guardApi, idParam } from "@/lib/api";
import { deleteAllocation } from "@/lib/repo/allocations";

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await guardApi();
  if ("response" in guard) return guard.response;
  const id = idParam((await params).id);
  if (!id) return badRequest("ID tidak valid");
  await deleteAllocation(id);
  return NextResponse.json({ ok: true });
}
