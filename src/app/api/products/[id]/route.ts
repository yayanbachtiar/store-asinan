import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { products } from "@/db/schema";
import { badRequest, guardApi, idParam, parseBody } from "@/lib/api";

const patchSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  price: z.number().int().positive().optional(),
  isActive: z.boolean().optional(),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await guardApi();
  if ("response" in guard) return guard.response;
  const id = idParam((await params).id);
  if (!id) return badRequest("ID tidak valid");
  const body = parseBody(patchSchema, await request.json().catch(() => null));
  if (!body) return badRequest("Data tidak valid");
  const [row] = await db.update(products).set(body).where(eq(products.id, id)).returning();
  if (!row) return NextResponse.json({ error: "Tidak ditemukan" }, { status: 404 });
  return NextResponse.json(row);
}
