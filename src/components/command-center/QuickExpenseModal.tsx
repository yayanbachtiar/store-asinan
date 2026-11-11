"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CuteBananaMascot } from "@/components/CuteBananaMascot";
import { formatRupiahInput, parseRupiahInput } from "@/lib/format";

export interface MemberOpt {
  id: string;
  name: string;
}

export interface QuickExpenseModalProps {
  batchId: string;
  members: MemberOpt[];
  currentMemberId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function QuickExpenseModal({
  batchId,
  members,
  currentMemberId,
  isOpen,
  onClose,
  onSuccess,
}: QuickExpenseModalProps) {
  const router = useRouter();
  const [description, setDescription] = useState("");
  const [amountStr, setAmountStr] = useState("");
  const [paidBy, setPaidBy] = useState(currentMemberId || members[0]?.id || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleClose = () => {
    setErrorMsg(null);
    setDescription("");
    setAmountStr("");
    onClose();
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatRupiahInput(e.target.value);
    setAmountStr(formatted);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const amount = parseRupiahInput(amountStr);
    if (!description.trim()) {
      setErrorMsg("Keterangan belanja bahan harus diisi ya 🌸");
      return;
    }
    if (amount <= 0) {
      setErrorMsg("Nominal pengeluaran harus lebih besar dari Rp 0");
      return;
    }
    if (!paidBy) {
      setErrorMsg("Pilih anggota yang menalangi belanja bahan");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          batchId,
          description: description.trim(),
          amount,
          paidBy,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Gagal mencatat pengeluaran");
      }

      setDescription("");
      setAmountStr("");
      onClose();
      if (onSuccess) onSuccess();
      router.refresh();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#2D1B2D]/40 p-3 sm:p-4 backdrop-blur-xs">
      <div className="relative w-full max-w-md rounded-3xl bg-[#FFFDF9] border border-pink-200 p-5 sm:p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-pink-100 pb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-100 to-pink-100 p-1 shadow-2xs">
              <CuteBananaMascot variant="sticker" size={36} />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-[#2D1B2D]">
                - Catat Belanja Bahan
              </h3>
              <p className="text-xs text-[#7A6273]">
                Pengeluaran belanja modal batch yang langsung masuk HPP
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-full p-2 text-pink-400 hover:bg-pink-100/60 hover:text-pink-600 transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        {errorMsg && (
          <div className="mt-3 rounded-2xl border border-rose-200 bg-rose-50/90 p-3 text-xs text-rose-800 font-medium">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="text-xs font-bold text-[#7A6273]">
              Keterangan Belanja Bahan
            </label>
            <input
              type="text"
              placeholder="Contoh: Buah mangga, kedondong, cup &amp; gula pasir..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              autoFocus
              required
            />
          </div>

          <div>
            <label className="text-xs font-bold text-[#7A6273]">
              Nominal Uang (Rp)
            </label>
            <input
              type="text"
              inputMode="numeric"
              placeholder="Rp 0"
              value={amountStr}
              onChange={handleAmountChange}
              required
              className="text-base font-extrabold text-pink-900"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-[#7A6273]">
              Ditalangi Oleh (Anggota Tim)
            </label>
            <select
              value={paidBy}
              onChange={(e) => setPaidBy(e.target.value)}
              required
            >
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  🌸 {m.name}
                </option>
              ))}
            </select>
          </div>

          <div className="border-t border-pink-100 pt-4 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="rounded-full border border-pink-200 bg-white px-4 py-2 text-xs font-bold text-[#7A6273] hover:bg-pink-50 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !amountStr || !description.trim()}
              className="rounded-full bg-gradient-to-r from-pink-500 to-rose-500 px-5 py-2 text-xs font-bold text-white shadow-md shadow-pink-200 hover:from-pink-600 hover:to-rose-600 active:scale-95 disabled:opacity-50 transition-all"
            >
              {isSubmitting ? "Menyimpan..." : "✨ Simpan Belanja"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
