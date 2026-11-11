import { NextResponse } from "next/server";
import { z } from "zod";
import { badRequest, guardApi, parseBody } from "@/lib/api";
import { askAiChat, type ChatMessage } from "@/lib/ai-client";

const messageSchema = z.object({
  role: z.enum(["system", "user", "assistant"]),
  content: z.string().min(1, "Konten pesan tidak boleh kosong"),
});

const chatBodySchema = z.object({
  messages: z.array(messageSchema).min(1, "Minimal harus ada 1 pesan"),
});

export async function POST(request: Request) {
  const guard = await guardApi();
  if ("response" in guard) return guard.response;

  const rawJson = await request.json().catch(() => null);
  const body = parseBody(chatBodySchema, rawJson);
  if (!body) return badRequest("Payload chat tidak valid");

  const reply = await askAiChat(body.messages as ChatMessage[]);
  return NextResponse.json({ reply });
}
