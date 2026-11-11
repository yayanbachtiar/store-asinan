export function StatCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200/80 bg-white/95 p-4 shadow-xs transition-shadow hover:shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</p>
      <p className="mt-1.5 text-2xl font-bold tracking-tight text-slate-900">{value}</p>
      {sub && <p className="mt-1 text-xs text-slate-500">{sub}</p>}
    </div>
  );
}

export function DbUnavailable() {
  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-4 text-sm text-amber-900">
      <p className="font-semibold">Database belum tersedia.</p>
      <p className="mt-1 text-xs text-amber-800">
        Halaman ini membaca Firestore saat runtime. Pastikan konfigurasi Firebase
        (project ID &amp; kredensial Admin SDK / service account Cloud Run) sudah benar,
        dan produk awal sudah di-seed (<code>pnpm seed:products</code>).
      </p>
    </div>
  );
}

export function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="mb-3 mt-6 text-base font-bold tracking-tight text-slate-900">{children}</h2>;
}
