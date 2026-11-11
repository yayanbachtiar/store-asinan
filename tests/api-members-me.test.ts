import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock @/lib/auth
vi.mock("@/lib/auth", () => ({
  requireApiMember: vi.fn(),
}));

// Mock @/lib/repo/members
vi.mock("@/lib/repo/members", () => ({
  getMember: vi.fn(),
  updateMember: vi.fn(),
  findMemberByTelegramId: vi.fn(),
}));

import { requireApiMember } from "@/lib/auth";
import { getMember, updateMember, findMemberByTelegramId } from "@/lib/repo/members";
import { GET, PATCH, cleanTelegramHandle } from "@/app/api/members/me/route";

describe("API /api/members/me", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("cleanTelegramHandle", () => {
    it("strips leading @ symbol", () => {
      expect(cleanTelegramHandle("@husein")).toBe("husein");
      expect(cleanTelegramHandle("@@husein")).toBe("@husein");
    });

    it("returns null for empty or whitespace-only inputs", () => {
      expect(cleanTelegramHandle("")).toBeNull();
      expect(cleanTelegramHandle("   ")).toBeNull();
      expect(cleanTelegramHandle(null)).toBeNull();
      expect(cleanTelegramHandle(undefined)).toBeNull();
    });

    it("preserves numeric ID strings", () => {
      expect(cleanTelegramHandle("123456789")).toBe("123456789");
    });
  });

  describe("GET /api/members/me", () => {
    it("returns 401 when user is not logged in", async () => {
      vi.mocked(requireApiMember).mockResolvedValue(null);

      const res = await GET();
      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.error).toBe("Belum login");
    });

    it("returns member details when logged in", async () => {
      vi.mocked(requireApiMember).mockResolvedValue({
        id: "mem-1",
        name: "Husein",
        email: "husein@example.com",
        role: "bendahara",
      });
      vi.mocked(getMember).mockResolvedValue({
        id: "mem-1",
        name: "Husein",
        email: "husein@example.com",
        role: "bendahara",
        telegramId: "123456789",
        isActive: true,
        createdAt: "2026-01-01",
      });

      const res = await GET();
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.name).toBe("Husein");
      expect(data.telegramId).toBe("123456789");
    });
  });

  describe("PATCH /api/members/me", () => {
    it("returns 401 when user is not logged in", async () => {
      vi.mocked(requireApiMember).mockResolvedValue(null);
      const req = new Request("http://localhost/api/members/me", {
        method: "PATCH",
        body: JSON.stringify({ telegramId: "123456" }),
      });

      const res = await PATCH(req);
      expect(res.status).toBe(401);
    });

    it("updates telegramId cleanly", async () => {
      vi.mocked(requireApiMember).mockResolvedValue({
        id: "mem-1",
        name: "Husein",
        email: "husein@example.com",
        role: "bendahara",
      });
      vi.mocked(findMemberByTelegramId).mockResolvedValue(null);
      vi.mocked(updateMember).mockResolvedValue({
        id: "mem-1",
        name: "Husein",
        email: "husein@example.com",
        role: "bendahara",
        telegramId: "husein_asinan",
        isActive: true,
        createdAt: "2026-01-01",
      });

      const req = new Request("http://localhost/api/members/me", {
        method: "PATCH",
        body: JSON.stringify({ telegramId: "@husein_asinan" }),
      });

      const res = await PATCH(req);
      expect(res.status).toBe(200);
      expect(findMemberByTelegramId).toHaveBeenCalledWith("husein_asinan");
      expect(updateMember).toHaveBeenCalledWith("mem-1", { telegramId: "husein_asinan" });
    });

    it("rejects if telegramId is already used by another member", async () => {
      vi.mocked(requireApiMember).mockResolvedValue({
        id: "mem-1",
        name: "Husein",
        email: "husein@example.com",
        role: "bendahara",
      });
      vi.mocked(findMemberByTelegramId).mockResolvedValue({
        id: "mem-2",
        name: "Budi",
        email: "budi@example.com",
        role: "anggota",
        telegramId: "taken_id",
        isActive: true,
        createdAt: "2026-01-01",
      });

      const req = new Request("http://localhost/api/members/me", {
        method: "PATCH",
        body: JSON.stringify({ telegramId: "taken_id" }),
      });

      const res = await PATCH(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain("sudah digunakan oleh anggota lain");
      expect(updateMember).not.toHaveBeenCalled();
    });

    it("allows unlinking telegramId with null", async () => {
      vi.mocked(requireApiMember).mockResolvedValue({
        id: "mem-1",
        name: "Husein",
        email: "husein@example.com",
        role: "bendahara",
      });
      vi.mocked(updateMember).mockResolvedValue({
        id: "mem-1",
        name: "Husein",
        email: "husein@example.com",
        role: "bendahara",
        telegramId: null,
        isActive: true,
        createdAt: "2026-01-01",
      });

      const req = new Request("http://localhost/api/members/me", {
        method: "PATCH",
        body: JSON.stringify({ telegramId: null }),
      });

      const res = await PATCH(req);
      expect(res.status).toBe(200);
      expect(updateMember).toHaveBeenCalledWith("mem-1", { telegramId: null });
    });
  });
});
