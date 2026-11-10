import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentMember } from "@/lib/auth";

export const dynamic = "force-dynamic";

const NAV = [
  { href: "/", label: "Ringkasan" },
  { href: "/batch", label: "Batch" },
  { href: "/piutang", label: "Piutang" },
  { href: "/kas", label: "Kas & Setoran" },
  { href: "/pelanggan", label: "Pelanggan" },
  { href: "/pengaturan", label: "Pengaturan" },
];

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const member = await getCurrentMember();
  if (!member) redirect("/login");

  return (
    <div className="mx-auto w-full max-w-5xl px-3 pb-16 sm:px-4">
      <header className="flex flex-wrap items-center gap-x-4 gap-y-2 py-4">
        <Link href="/" className="text-lg font-bold">
          🥒 Kas Asinan
        </Link>
        <span className="text-xs text-stone-500">
          {member.name} · {member.role === "bendahara" ? "Bendahara" : "Anggota"}
        </span>
        <form action="/api/auth/logout" method="post" className="ml-auto">
          <button type="submit" className="text-xs font-medium text-stone-500 underline">
            Keluar
          </button>
        </form>
      </header>
      <nav className="mb-5 flex gap-2 overflow-x-auto pb-1">
        {NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="whitespace-nowrap rounded-full bg-white px-3 py-1.5 text-sm font-medium shadow-sm ring-1 ring-amber-200 hover:bg-amber-100"
          >
            {item.label}
          </Link>
        ))}
      </nav>
      <main>{children}</main>
    </div>
  );
}
