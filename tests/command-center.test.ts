import { describe, expect, it } from "vitest";

describe("Active batch resolution", () => {
  function getActiveBatch(batches: Array<{ id: string; status: "aktif" | "ditutup" }>) {
    return batches.find((b) => b.status === "aktif") ?? null;
  }

  it("returns active batch when present", () => {
    const batches = [
      { id: "1", status: "ditutup" as const },
      { id: "2", status: "aktif" as const },
    ];
    expect(getActiveBatch(batches)?.id).toBe("2");
  });

  it("returns null when all batches are closed so fallback UI triggers", () => {
    const batches = [
      { id: "1", status: "ditutup" as const },
      { id: "2", status: "ditutup" as const },
    ];
    expect(getActiveBatch(batches)).toBeNull();
  });
});
