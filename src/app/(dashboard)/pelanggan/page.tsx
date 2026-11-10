import { CustomerEdit, CustomerForm, DeleteButton } from "@/components/forms";
import { DbUnavailable } from "@/components/ui";
import { listCustomers } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function PelangganPage() {
  let rows: Awaited<ReturnType<typeof listCustomers>> | null = null;
  try {
    rows = await listCustomers();
  } catch {
    rows = null;
  }
  if (!rows) return <DbUnavailable />;
  return (
    <>
      <h1 className="mb-4 text-xl font-bold">Pelanggan</h1>
      <CustomerForm />
      <div className="mt-5 rounded-2xl border border-amber-200 bg-white p-4 shadow-sm">
        {rows.length === 0 && <p className="text-sm text-stone-500">Belum ada pelanggan.</p>}
        {rows.map((c) => (
          <div key={c.id} className="border-b border-stone-100 py-2.5 text-sm last:border-0">
            <div className="flex items-center justify-between">
              <span>
                <b>{c.name}</b>
                {c.note && <span className="block text-xs text-stone-500">{c.note}</span>}
              </span>
              <span className="flex items-center gap-3">
                <CustomerEdit id={c.id} initialName={c.name} initialNote={c.note} />
                <DeleteButton path={`/api/customers/${c.id}`} />
              </span>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
