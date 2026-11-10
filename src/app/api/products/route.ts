import { NextResponse } from "next/server";
import { z } from "zod";
import { badRequest, guardApi, parseBody } from "@/lib/api";
import { createProduct, findProductByName } from "@/lib/repo/products";

const createSchema = z.object({
  name: z.string().trim().min(1).max(120),
  price: z.number().int().positive(),
});

export async function POST(request: Request) {
  const guard = await guardApi();
  if ("response" in guard) return guard.response;
  const body = parseBody(createSchema, await request.json().catch(() => null));
  if (!body) return badRequest("Data produk tidak valid");
  // Keunikan nama produk dijaga di aplikasi (Firestore tanpa unique constraint).
  if (await findProductByName(body.name)) {
    return badRequest("Nama produk sudah ada");
  }
  const row = await createProduct({ ...body, isActive: true });
  return NextResponse.json(row, { status: 201 });
}
