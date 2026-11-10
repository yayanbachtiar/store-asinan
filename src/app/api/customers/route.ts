import { NextResponse } from "next/server";
import { asc } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { customers } from "@/db/schema";
import { badRequest, guardApi, parseBody } from "@/lib/api";

const createSchema = z.object({
  name: z.string().trim().min(1).max(120),
  note: z.string().trim().max(200).optional(),
});

export async function GET() {
  const guard = await guardApi();
  if ("response" in guard) return guard.response;
  const rows = await db.select().from(customers).orderBy(asc(customers.name));
  return NextResponse.json(rows);
}

export async function POST(request: Request) {
  const guard = await guardApi();
  if ("response" in guard) return guard.response;
  const body = parseBody(createSchema, await request.json().catch(() => null));
  if (!body) return badRequest("Data pelanggan tidak valid");
  const [row] = await db
    .insert(customers)
    .values({ name: body.name, note: body.note || null, createdBy: guard.member.id })
    .returning();
  return NextResponse.json(row, { status: 201 });
}
