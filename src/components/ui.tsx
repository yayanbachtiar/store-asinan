import { CuteBananaMascot } from "./CuteBananaMascot";

export type StatColorVariant = "pink" | "butter" | "lavender" | "mint" | "default";

const VARIANT_STYLES: Record<StatColorVariant, { bg: string; border: string; iconBg: string; textVal: string }> = {
  pink: {
    bg: "bg-gradient-to-br from-pink-50/90 via-white to-rose-50/40",
    border: "border-pink-200/80 hover:border-pink-300",
    iconBg: "bg-pink-100 text-pink-600",
    textVal: "text-rose-600",
  },
  butter: {
    bg: "bg-gradient-to-br from-amber-50/80 via-white to-orange-50/30",
    border: "border-amber-200/70 hover:border-amber-300",
    iconBg: "bg-amber-100 text-amber-700",
    textVal: "text-amber-800",
  },
  lavender: {
    bg: "bg-gradient-to-br from-purple-50/80 via-white to-pink-50/30",
    border: "border-purple-200/70 hover:border-purple-300",
    iconBg: "bg-purple-100 text-purple-700",
    textVal: "text-purple-900",
  },
  mint: {
    bg: "bg-gradient-to-br from-emerald-50/80 via-white to-teal-50/30",
    border: "border-emerald-200/70 hover:border-emerald-300",
    iconBg: "bg-emerald-100 text-emerald-700",
    textVal: "text-emerald-700",
  },
  default: {
    bg: "bg-white",
    border: "border-pink-100/90 hover:border-pink-200",
    iconBg: "bg-pink-50 text-pink-600",
    textVal: "text-[#2D1B2D]",
  },
};

export function StatCard({
  label,
  value,
  sub,
  icon,
  variant = "default",
}: {
  label: string;
  value: string;
  sub?: string;
  icon?: string;
  variant?: StatColorVariant;
}) {
  const v = VARIANT_STYLES[variant] || VARIANT_STYLES.default;

  return (
    <div
      className={`relative overflow-hidden rounded-3xl border ${v.border} ${v.bg} p-4 sm:p-5 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:shadow-pink-100/40`}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] font-bold uppercase tracking-wider text-[#7A6273]">
          {label}
        </p>
        {icon && (
          <span
            className={`flex h-8 w-8 items-center justify-center rounded-2xl ${v.iconBg} text-base shadow-2xs`}
          >
            {icon}
          </span>
        )}
      </div>
      <p className={`mt-2 text-2xl font-extrabold tracking-tight ${v.textVal}`}>
        {value}
      </p>
      {sub && (
        <div className="mt-1.5 flex items-center gap-1.5">
          <span className="inline-block rounded-full bg-white/80 px-2 py-0.5 text-[11px] font-semibold text-[#7A6273] shadow-2xs border border-pink-100/60">
            {sub}
          </span>
        </div>
      )}
    </div>
  );
}

export function DbUnavailable() {
  return (
    <div className="rounded-3xl border border-pink-200/90 bg-gradient-to-br from-pink-50 via-white to-amber-50/40 p-6 text-sm text-[#2D1B2D] shadow-xs max-w-lg mx-auto my-6 text-center">
      <span className="text-3xl">🎀</span>
      <p className="mt-2 text-base font-bold text-pink-900">Database Belum Tersedia</p>
      <p className="mt-1.5 text-xs text-[#7A6273] leading-relaxed">
        Halaman ini membaca Firestore saat runtime. Pastikan konfigurasi Firebase
        (project ID &amp; kredensial Admin SDK) sudah benar, dan produk awal sudah di-seed.
      </p>
      <div className="mt-4 inline-block rounded-xl bg-pink-100/70 px-3 py-1 text-xs font-mono text-pink-800 border border-pink-200/60">
        pnpm seed:products
      </div>
    </div>
  );
}

export function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-3 mt-6 text-base font-extrabold tracking-tight text-[#2D1B2D] flex items-center gap-2">
      <span className="h-2 w-2 rounded-full bg-pink-400"></span>
      <span>{children}</span>
    </h2>
  );
}

export function CuteEmptyState({
  title,
  message,
  action,
}: {
  title: string;
  message: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border border-pink-200/80 bg-white/70 backdrop-blur-xs p-8 text-center shadow-xs">
      <CuteBananaMascot variant="empty" size={80} />
      <h3 className="mt-3 text-sm font-bold text-[#2D1B2D]">{title}</h3>
      <p className="mt-1 text-xs text-[#7A6273] max-w-sm leading-relaxed">{message}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
