import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { products } from "@/db/schema";
import { badRequest, guardApi, parseBody } from "@/lib/api";

const createSchema = z.object({
  name: z.string().trim().min(1).max(120),
  price: z.number().int().positive(),
});

export async function POST(request: Request) {
  const guard = await guardApi();
  if ("response" in guard) return guard.response;
  const body = parseBody(createSchema, await request.json().catch(() => null));
  if (!body) return badRequest("Data produk tidak valid");
  try {
    const [row] = await db.insert(products).values(body).returning();
    return NextResponse.json(row, { status: 201 });
  } catch {
    return badRequest("Nama produk sudah ada");
  }
}
