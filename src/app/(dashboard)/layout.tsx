import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentMember } from "@/lib/auth";

export const dynamic = "force-dynamic";

const NAV = [
  { href: "/", label: "Ringkasan", icon: "📊" },
  { href: "/batch", label: "Batch", icon: "📦" },
  { href: "/piutang", label: "Piutang", icon: "⏳" },
  { href: "/kas", label: "Kas & Setoran", icon: "💰" },
  { href: "/pelanggan", label: "Pelanggan", icon: "👥" },
  { href: "/pengaturan", label: "Pengaturan", icon: "⚙️" },
];

const MOBILE_NAV = [
  { href: "/", label: "Ringkasan", icon: "📊" },
  { href: "/batch", label: "Batch", icon: "📦" },
  { href: "/piutang", label: "Piutang", icon: "⏳" },
  { href: "/kas", label: "Kas", icon: "💰" },
  { href: "/pelanggan", label: "Pelanggan", icon: "👥" },
];

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const member = await getCurrentMember();
  if (!member) redirect("/login");

  return (
    <div className="mx-auto w-full max-w-5xl px-3 pb-24 sm:px-4 sm:pb-16">
      <header className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 py-4 border-b border-slate-200/80 mb-4 sm:border-none sm:mb-0">
        <div className="flex items-center gap-2">
          <Link href="/" className="text-lg font-bold tracking-tight text-slate-900 flex items-center gap-1.5">
            <span className="text-xl">🥒</span>
            <span>Kas Asinan</span>
          </Link>
          <span className="inline-flex items-center rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
            {member.role === "bendahara" ? "Bendahara" : "Anggota"}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500 hidden sm:inline">
            {member.name}
          </span>
          <Link
            href="/pengaturan"
            className="text-xs font-medium text-slate-500 hover:text-emerald-700 sm:hidden"
            title="Pengaturan"
          >
            ⚙️
          </Link>
          <form action="/api/auth/logout" method="post">
            <button
              type="submit"
              className="text-xs font-medium text-slate-500 hover:text-rose-600 transition-colors"
            >
              Keluar
            </button>
          </form>
        </div>
      </header>

      {/* Desktop Navigation */}
      <nav className="mb-6 hidden sm:flex gap-2 overflow-x-auto pb-1">
        {NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="whitespace-nowrap rounded-lg border border-slate-200 bg-white/90 px-3.5 py-1.5 text-xs font-semibold text-slate-700 shadow-xs transition-colors hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-800"
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <main>{children}</main>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="fixed bottom-0 inset-x-0 z-40 flex items-center justify-around border-t border-slate-200 bg-white/95 px-2 py-1.5 backdrop-blur-md shadow-lg sm:hidden">
        {MOBILE_NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex flex-col items-center justify-center py-1 px-2 text-slate-600 hover:text-emerald-700 active:scale-95 transition-all"
          >
            <span className="text-lg leading-none">{item.icon}</span>
            <span className="mt-1 text-[10px] font-medium leading-none">{item.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
