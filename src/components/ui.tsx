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
    <div className="rounded-2xl border border-amber-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-stone-500">{label}</p>
      <p className="mt-1 text-xl font-bold">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-stone-500">{sub}</p>}
    </div>
  );
}

export function DbUnavailable() {
  return (
    <div className="rounded-2xl border border-amber-300 bg-amber-100 p-4 text-sm">
      <p className="font-semibold">Database belum tersedia.</p>
      <p className="mt-1 text-stone-600">
        Halaman ini membaca database saat runtime. Pastikan <code>DATABASE_URL</code> terisi,
        migrasi sudah dijalankan, dan produk awal sudah di-seed (
        <code>pnpm db:seed-products</code>).
      </p>
    </div>
  );
}

export function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="mb-3 mt-8 text-lg font-bold">{children}</h2>;
}
