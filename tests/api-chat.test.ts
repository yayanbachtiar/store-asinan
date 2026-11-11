import { describe, it, expect } from "vitest";

function validateChatRequest(body: unknown): { valid: boolean; error?: string } {
  if (!body || typeof body !== "object") {
    return { valid: false, error: "Body harus berupa JSON object" };
  }
  const b = body as { messages?: unknown };
  if (!Array.isArray(b.messages) || b.messages.length === 0) {
    return { valid: false, error: "messages harus berupa array dan tidak boleh kosong" };
  }
  const lastMsg = b.messages[b.messages.length - 1];
  if (!lastMsg || typeof lastMsg !== "object" || !("content" in lastMsg) || !lastMsg.content) {
    return { valid: false, error: "Pesan terakhir harus memiliki konten teks" };
  }
  return { valid: true };
}

describe("chat api request validation", () => {
  it("rejects non-object or empty payload", () => {
    expect(validateChatRequest(null).valid).toBe(false);
    expect(validateChatRequest(undefined).valid).toBe(false);
    expect(validateChatRequest("string").valid).toBe(false);
  });

  it("rejects empty messages array", () => {
    expect(validateChatRequest({ messages: [] }).valid).toBe(false);
    expect(validateChatRequest({ messages: "not-array" }).valid).toBe(false);
  });

  it("rejects message without content", () => {
    expect(validateChatRequest({ messages: [{ role: "user", content: "" }] }).valid).toBe(false);
  });

  it("accepts valid message history", () => {
    const valid = validateChatRequest({
      messages: [
        { role: "user", content: "Halo" },
        { role: "assistant", content: "Halo juga!" },
        { role: "user", content: "Berapa omset hari ini?" },
      ],
    });
    expect(valid.valid).toBe(true);
  });
});
