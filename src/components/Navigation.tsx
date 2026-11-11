"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CuteBananaMascot } from "./CuteBananaMascot";

export interface NavigationProps {
  member: {
    id: string;
    name: string;
    email: string;
    role: "bendahara" | "anggota";
  };
}

const NAV_ITEMS = [
  { href: "/", label: "Ringkasan", icon: "🌸" },
  { href: "/batch", label: "Batch", icon: "📦" },
  { href: "/piutang", label: "Piutang", icon: "⏳" },
  { href: "/kas", label: "Kas & Setoran", icon: "💰" },
  { href: "/pelanggan", label: "Pelanggan", icon: "👥" },
  { href: "/pengaturan", label: "Pengaturan", icon: "⚙️" },
];

const MOBILE_NAV_ITEMS = [
  { href: "/", label: "Home", icon: "🌸" },
  { href: "/batch", label: "Batch", icon: "📦" },
  { href: "/piutang", label: "Piutang", icon: "⏳" },
  { href: "/kas", label: "Kas", icon: "💰" },
  { href: "/pelanggan", label: "Pelanggan", icon: "👥" },
];

export function Navigation({ member }: NavigationProps) {
  const pathname = usePathname();

  const isLinkActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Unified Top Navigation Header (Desktop & Tablet) */}
      <header className="sticky top-3 z-30 mb-6 w-full rounded-3xl border border-pink-200/80 bg-white/90 px-4 py-2.5 shadow-xs shadow-pink-100/50 backdrop-blur-md transition-all">
        <div className="flex items-center justify-between gap-3">
          {/* Brand with Cute Banana Mascot */}
          <Link href="/" className="group flex items-center gap-2.5 shrink-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-100/80 to-pink-100/80 p-0.5 shadow-2xs group-hover:scale-105 transition-transform">
              <CuteBananaMascot variant="sticker" size={32} />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-black text-sm tracking-tight text-[#2D1B2D]">
                  Kas Asinan
                </span>
                <span className="rounded-full bg-pink-100/80 px-2 py-0.5 text-[10px] font-bold text-pink-700">
                  {member.role === "bendahara" ? "👑 Bendahara" : "🌸 Anggota"}
                </span>
              </div>
              <span className="text-[10px] font-medium text-[#7A6273]">
                Finance &amp; Command Center
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1 rounded-full bg-pink-50/70 p-1 border border-pink-100/80">
            {NAV_ITEMS.map((item) => {
              const active = isLinkActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition-all ${
                    active
                      ? "bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-xs shadow-pink-300 scale-100"
                      : "text-[#7A6273] hover:text-pink-600 hover:bg-white/80"
                  }`}
                >
                  <span className="text-sm leading-none">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* User Profile Pill & Actions */}
          <div className="flex items-center gap-2.5">
            <span className="hidden sm:inline text-xs font-medium text-[#7A6273]">
              Hai, <strong className="text-[#2D1B2D]">{member.name}</strong> 🌸
            </span>
            <Link
              href="/pengaturan"
              className="lg:hidden text-xs font-semibold text-[#7A6273] hover:text-pink-600 p-2 rounded-2xl hover:bg-pink-50 border border-pink-100 transition-colors"
              title="Pengaturan"
            >
              ⚙️
            </Link>
            <form action="/api/auth/logout" method="post">
              <button
                type="submit"
                className="rounded-full border border-pink-200 bg-white/90 px-3.5 py-1.5 text-xs font-bold text-[#7A6273] shadow-2xs hover:border-pink-300 hover:bg-rose-50 hover:text-rose-600 transition-all active:scale-95 cursor-pointer"
              >
                Keluar
              </button>
            </form>
          </div>
        </div>

        {/* Medium Screens (Tablet) Navigation row */}
        <nav className="mt-2.5 pt-2.5 border-t border-pink-100/70 hidden sm:flex lg:hidden gap-1.5 overflow-x-auto pb-0.5">
          {NAV_ITEMS.map((item) => {
            const active = isLinkActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-bold transition-all ${
                  active
                    ? "bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-xs shadow-pink-300"
                    : "border border-pink-100 bg-pink-50/50 text-[#7A6273] hover:bg-white hover:text-pink-600"
                }`}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </header>

      {/* Mobile Floating Bottom Navigation Dock */}
      <nav className="fixed bottom-3 inset-x-3 z-40 sm:hidden mx-auto max-w-sm rounded-full border border-pink-200/90 bg-white/95 p-1.5 shadow-lg shadow-pink-200/50 backdrop-blur-md flex items-center justify-around">
        {MOBILE_NAV_ITEMS.map((item) => {
          const active = isLinkActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-full transition-all ${
                active
                  ? "bg-gradient-to-r from-pink-500 to-rose-500 text-white font-bold shadow-xs scale-105"
                  : "text-[#7A6273] hover:text-pink-600"
              }`}
            >
              <span className="text-base leading-none">{item.icon}</span>
              <span className="mt-0.5 text-[9px] font-semibold leading-none">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
