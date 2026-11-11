import { describe, expect, it } from "vitest";
import { formatRupiahInput, parseRupiahInput } from "@/lib/format";

describe("Rupiah input helpers", () => {
  it("formats raw digit strings to currency display", () => {
    expect(formatRupiahInput("150000")).toBe("Rp 150.000");
    expect(formatRupiahInput("0")).toBe("Rp 0");
    expect(formatRupiahInput("")).toBe("");
  });

  it("sanitizes dirty input before formatting", () => {
    expect(formatRupiahInput("Rp 25.000")).toBe("Rp 25.000");
    expect(formatRupiahInput("abc12000xyz")).toBe("Rp 12.000");
  });

  it("parses formatted string back into number", () => {
    expect(parseRupiahInput("Rp 150.000")).toBe(150000);
    expect(parseRupiahInput("")).toBe(0);
    expect(parseRupiahInput("Rp 0")).toBe(0);
  });
});
