import { NextResponse } from "next/server";
import { z } from "zod";
import { badRequest, getRequestLogger, guardApi, parseBody } from "@/lib/api";
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

  const logger = await getRequestLogger();

  const rawJson = await request.json().catch(() => null);
  const body = parseBody(chatBodySchema, rawJson);
  if (!body) {
    logger.warn("Payload chat tidak valid", { userId: guard.member.id });
    return badRequest("Payload chat tidak valid");
  }

  logger.info("AI chat request received", {
    userId: guard.member.id,
    userEmail: guard.member.email,
    messageCount: body.messages.length,
  });

  const reply = await askAiChat(body.messages as ChatMessage[]);
  return NextResponse.json({ reply });
}
