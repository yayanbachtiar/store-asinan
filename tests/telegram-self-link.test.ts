import { describe, it, expect } from "vitest";
import { formatTelegramStatus, cleanTelegramInput } from "@/lib/telegram-format";

describe("Telegram self-link helper formatting", () => {
  it("sanitizes telegram handle input by removing leading @", () => {
    expect(cleanTelegramInput("@husein123")).toBe("husein123");
    expect(cleanTelegramInput("  @budi  ")).toBe("budi");
    expect(cleanTelegramInput("987654321")).toBe("987654321");
    expect(cleanTelegramInput("")).toBeNull();
    expect(cleanTelegramInput("   ")).toBeNull();
  });

  it("formats status badge label correctly", () => {
    expect(formatTelegramStatus("123456789")).toEqual({
      connected: true,
      label: "Terhubung (ID: 123456789)",
    });
    expect(formatTelegramStatus("husein")).toEqual({
      connected: true,
      label: "Terhubung (@husein)",
    });
    expect(formatTelegramStatus(null)).toEqual({
      connected: false,
      label: "Belum Terhubung",
    });
  });
});
