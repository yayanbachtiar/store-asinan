"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
      setErrorMsg("Keterangan belanja bahan harus diisi");
      return;
    }
    if (amount <= 0) {
      setErrorMsg("Nominal pengeluaran harus lebih besar dari 0");
      return;
    }
    if (!paidBy) {
      setErrorMsg("Pilih anggota yang menalangi belanja");
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-3 sm:p-4 backdrop-blur-xs">
      <div className="relative w-full max-w-md rounded-2xl bg-white p-5 sm:p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-bold text-slate-900">- Catat Belanja Bahan</h3>
            <p className="text-xs text-slate-500">Pengeluaran belanja modal batch aktif</p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            ✕
          </button>
        </div>

        {errorMsg && (
          <div className="mt-3 rounded-lg border border-rose-200 bg-rose-50 p-2.5 text-xs text-rose-700">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-700">
              Keterangan Belanja
            </label>
            <input
              type="text"
              placeholder="Contoh: Buah nanas & mangga, cup plastik..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              autoFocus
              required
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700">
              Nominal (Rp)
            </label>
            <input
              type="text"
              inputMode="numeric"
              placeholder="Rp 0"
              value={amountStr}
              onChange={handleAmountChange}
              required
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700">
              Ditalangi Oleh (Anggota)
            </label>
            <select
              value={paidBy}
              onChange={(e) => setPaidBy(e.target.value)}
              required
            >
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>

          <div className="border-t border-slate-100 pt-4 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="rounded-lg border border-slate-200 px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !amountStr || !description.trim()}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700 disabled:opacity-50 transition-colors"
            >
              {isSubmitting ? "Menyimpan..." : "Simpan Pengeluaran"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
