import { describe, it, expect } from "vitest";
import { authorizeTelegramUser, formatUnauthorizedMessage } from "../scripts/telegram-bot-helper.mjs";

describe("Telegram Bot Dynamic Authorization", () => {
  it("authorizes user matching active member numeric telegramId", async () => {
    const mockDb = {
      collection: () => ({
        where: () => ({
          get: async () => ({
            docs: [
              {
                id: "mem-1",
                data: () => ({
                  name: "Husein",
                  role: "bendahara",
                  telegramId: "123456789",
                  isActive: true,
                }),
              },
            ],
          }),
        }),
      }),
    };

    const user = { id: 123456789, username: "husein_dev" };
    const result = await authorizeTelegramUser(user, mockDb as any, "");
    expect(result.authorized).toBe(true);
    expect(result.member?.name).toBe("Husein");
  });

  it("authorizes user matching active member username without case-sensitivity", async () => {
    const mockDb = {
      collection: () => ({
        where: () => ({
          get: async () => ({
            docs: [
              {
                id: "mem-2",
                data: () => ({
                  name: "Sarah",
                  role: "anggota",
                  telegramId: "@Sarah_Asinan",
                  isActive: true,
                }),
              },
            ],
          }),
        }),
      }),
    };

    const user = { id: 987654321, username: "sarah_asinan" };
    const result = await authorizeTelegramUser(user, mockDb as any, "");
    expect(result.authorized).toBe(true);
    expect(result.member?.name).toBe("Sarah");
  });

  it("rejects user if member is inactive", async () => {
    const mockDb = {
      collection: () => ({
        where: () => ({
          get: async () => ({
            // Firestore query filters isActive == true, so inactive won't be returned
            docs: [],
          }),
        }),
      }),
    };

    const user = { id: 999999, username: "inactive_user" };
    const result = await authorizeTelegramUser(user, mockDb as any, "");
    expect(result.authorized).toBe(false);
  });

  it("falls back to TELEGRAM_ALLOWED_USERS env var if no member match", async () => {
    const mockDb = {
      collection: () => ({
        where: () => ({
          get: async () => ({ docs: [] }),
        }),
      }),
    };

    const user = { id: 55555, username: "fallback_admin" };
    const result = await authorizeTelegramUser(user, mockDb as any, "11111, 55555, other_user");
    expect(result.authorized).toBe(true);
    expect(result.member).toBeNull();
  });

  it("formats unauthorized rejection message with 1-tap copyable monospace user ID", () => {
    const user = { id: 7891011, username: "unauthorized_user" };
    const message = formatUnauthorizedMessage(user);
    expect(message).toContain("`7891011`");
    expect(message).toContain("Pengaturan");
    expect(message).toContain("Akun Telegram Saya");
  });
});
