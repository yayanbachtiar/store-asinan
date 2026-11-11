import { NextResponse } from "next/server";
import { z } from "zod";
import { badRequest, guardApi, parseBody } from "@/lib/api";
import {
  findMemberByTelegramId,
  getMember,
  updateMember,
} from "@/lib/repo/members";
import { cleanTelegramInput } from "@/lib/telegram-format";

const patchSchema = z.object({
  telegramId: z.string().trim().max(64).nullable().optional(),
});

export async function GET() {
  const guard = await guardApi();
  if ("response" in guard) return guard.response;
  const member = await getMember(guard.member.id);
  if (!member) {
    return NextResponse.json({ error: "Akun tidak ditemukan" }, { status: 404 });
  }
  return NextResponse.json({
    id: member.id,
    name: member.name,
    email: member.email,
    role: member.role,
    telegramId: member.telegramId,
    isActive: member.isActive,
  });
}

export async function PATCH(request: Request) {
  const guard = await guardApi();
  if ("response" in guard) return guard.response;
  const rawBody = await request.json().catch(() => null);
  const body = parseBody(patchSchema, rawBody);
  if (!body) return badRequest("Data tidak valid");

  const cleaned = cleanTelegramInput(body.telegramId);

  if (cleaned) {
    const existing = await findMemberByTelegramId(cleaned);
    if (existing && existing.id !== guard.member.id) {
      return badRequest("ID / username Telegram sudah digunakan oleh anggota lain");
    }
  }

  const updated = await updateMember(guard.member.id, { telegramId: cleaned });
  if (!updated) {
    return NextResponse.json({ error: "Gagal memperbarui profil" }, { status: 500 });
  }

  return NextResponse.json(updated);
}
