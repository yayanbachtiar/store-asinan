export function formatRp(value: number): string {
  return `Rp${value.toLocaleString("id-ID")}`;
}

export function formatPct(value: number | null): string {
  if (value === null) return "—";
  return `${value.toLocaleString("id-ID", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;
}
