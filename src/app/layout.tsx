import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kas Asinan — Pencatatan Order & Keuangan",
  description: "Aplikasi pencatatan order, piutang, setoran, dan laba usaha asinan untuk tim 5 orang.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
