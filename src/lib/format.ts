export function formatRp(value: number): string {
  return `Rp${value.toLocaleString("id-ID")}`;
}

export function formatPct(value: number | null): string {
  if (value === null) return "—";
  return `${value.toLocaleString("id-ID", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;
}

export function formatRupiahInput(raw: string | number): string {
  const str = String(raw);
  const digits = str.replace(/\D/g, "");
  if (!digits) return "";
  const num = parseInt(digits, 10);
  return `Rp ${num.toLocaleString("id-ID")}`;
}

export function parseRupiahInput(formatted: string): number {
  const digits = formatted.replace(/\D/g, "");
  if (!digits) return 0;
  return parseInt(digits, 10) || 0;
}

