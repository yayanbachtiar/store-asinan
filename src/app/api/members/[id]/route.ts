import { NextResponse } from "next/server";
import { z } from "zod";
import { badRequest, guardApi, idParam, parseBody } from "@/lib/api";
import {
  findMemberByEmail,
  findMemberByTelegramId,
  updateMember,
} from "@/lib/repo/members";

const patchSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  email: z
    .string()
    .trim()
    .email()
    .transform((v) => v.toLowerCase())
    .optional(),
  role: z.enum(["bendahara", "anggota"]).optional(),
  telegramId: z.string().trim().max(64).nullable().optional(),
  isActive: z.boolean().optional(),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await guardApi();
  if ("response" in guard) return guard.response;
  const id = idParam((await params).id);
  if (!id) return badRequest("ID tidak valid");
  const body = parseBody(patchSchema, await request.json().catch(() => null));
  if (!body) return badRequest("Data tidak valid");
  if (body.email) {
    const other = await findMemberByEmail(body.email);
    if (other && other.id !== id) return badRequest("Email sudah dipakai anggota lain");
  }
  if (body.telegramId) {
    const other = await findMemberByTelegramId(body.telegramId);
    if (other && other.id !== id) return badRequest("Telegram ID sudah dipakai anggota lain");
  }
  const row = await updateMember(id, body);
  if (!row) return NextResponse.json({ error: "Tidak ditemukan" }, { status: 404 });
  return NextResponse.json(row);
}
