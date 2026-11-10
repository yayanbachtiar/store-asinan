import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { members } from "@/db/schema";
import { badRequest, guardApi, parseBody } from "@/lib/api";

const createSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().transform((v) => v.toLowerCase()),
  role: z.enum(["bendahara", "anggota"]).default("anggota"),
  telegramId: z.string().trim().max(64).optional(),
});

export async function POST(request: Request) {
  const guard = await guardApi();
  if ("response" in guard) return guard.response;
  const body = parseBody(createSchema, await request.json().catch(() => null));
  if (!body) return badRequest("Data anggota tidak valid");
  try {
    const [row] = await db
      .insert(members)
      .values({ ...body, telegramId: body.telegramId || null })
      .returning();
    return NextResponse.json(row, { status: 201 });
  } catch {
    return badRequest("Email / Telegram ID sudah dipakai anggota lain");
  }
}
