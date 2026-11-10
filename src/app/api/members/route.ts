import { NextResponse } from "next/server";
import { z } from "zod";
import { badRequest, guardApi, parseBody } from "@/lib/api";
import {
  createMember,
  findMemberByEmail,
  findMemberByTelegramId,
} from "@/lib/repo/members";

const createSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z
    .string()
    .trim()
    .email()
    .transform((v) => v.toLowerCase()),
  role: z.enum(["bendahara", "anggota"]).default("anggota"),
  telegramId: z.string().trim().max(64).optional(),
});

export async function POST(request: Request) {
  const guard = await guardApi();
  if ("response" in guard) return guard.response;
  const body = parseBody(createSchema, await request.json().catch(() => null));
  if (!body) return badRequest("Data anggota tidak valid");
  // Firestore tidak punya unique constraint — keunikan email / Telegram ID
  // dijaga di lapisan aplikasi.
  if (await findMemberByEmail(body.email)) {
    return badRequest("Email sudah dipakai anggota lain");
  }
  if (body.telegramId && (await findMemberByTelegramId(body.telegramId))) {
    return badRequest("Telegram ID sudah dipakai anggota lain");
  }
  const row = await createMember({
    name: body.name,
    email: body.email,
    role: body.role,
    telegramId: body.telegramId || null,
    isActive: true,
  });
  return NextResponse.json(row, { status: 201 });
}
