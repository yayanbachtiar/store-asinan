import { describe, it, expect } from "vitest";

// Logic helpers from telegram bot runner
export function isUserAuthorized(
  user: { id: number; username?: string },
  allowedList?: string
): boolean {
  if (!allowedList || !allowedList.trim()) return true;
  const allowed = allowedList
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  if (allowed.length === 0) return true;

  const idStr = String(user.id);
  const usernameStr = (user.username || "").toLowerCase();

  return allowed.includes(idStr) || (Boolean(usernameStr) && allowed.includes(usernameStr));
}

export function handleTelegramCommand(command: string): string | null {
  const cmd = command.trim().toLowerCase();
  if (cmd === "/start" || cmd === "/help") {
    return "Halo! 🍌 Saya Asisten AI Toko Asinan.\nKetik pertanyaan tentang omset, kas, piutang, atau penjualan batch.";
  }
  return null;
}

describe("telegram bot helpers", () => {
  it("allows all users if allowed list is empty or whitespace", () => {
    expect(isUserAuthorized({ id: 12345, username: "john" }, "")).toBe(true);
    expect(isUserAuthorized({ id: 12345, username: "john" }, undefined)).toBe(true);
  });

  it("authorizes user by numeric id or username correctly", () => {
    const list = "12345, admin_asinan, 67890";
    expect(isUserAuthorized({ id: 12345, username: "someone" }, list)).toBe(true);
    expect(isUserAuthorized({ id: 99999, username: "admin_asinan" }, list)).toBe(true);
    expect(isUserAuthorized({ id: 99999, username: "stranger" }, list)).toBe(false);
  });

  it("handles /start and /help commands", () => {
    expect(handleTelegramCommand("/start")).toContain("Asisten AI Toko Asinan");
    expect(handleTelegramCommand("/help")).toContain("Asisten AI Toko Asinan");
    expect(handleTelegramCommand("berapa omset?")).toBeNull();
  });
});
