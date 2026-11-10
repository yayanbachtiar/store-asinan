# Kas Asinan — Pencatatan Order & Keuangan

Aplikasi untuk tim usaha asinan (5 orang): pencatatan order, pengeluaran
produksi per batch, pembayaran, piutang, setoran ke bendahara, talangan
modal, alokasi laba, dan ROI per batch. Dashboard adalah inti; Telegram/AI
adalah tahap berikutnya (agent pembantu), belum termasuk di MVP Tahap 0–1 ini.

Prinsip penting:
- **Status BAYAR ≠ status SETOR** — pelanggan bisa sudah bayar ke anggota,
  tapi uangnya belum tentu sudah disetor ke bendahara.
- Semua angka dihitung deterministik di `src/lib/finance.ts` (murni, teruji).
  Rekonsiliasi yang selalu klop: `omzet = kas bendahara + belum disetor + piutang`.

## Stack

Next.js 16 (App Router, TypeScript) · Tailwind CSS 4 · PostgreSQL + Drizzle ORM ·
pnpm · Login Google OAuth server-side dengan whitelist tabel `members`
(tanpa auto-provisioning, tanpa akun demo).

## Jalan lokal

```bash
pnpm install
cp .env.example .env        # isi DATABASE_URL dll.
pnpm db:migrate             # terapkan migrasi Drizzle
pnpm db:seed-products       # produk awal: Cup Kecil 10rb, Cup Besar 20rb
pnpm dev
```

Akun pertama: tambahkan baris anggota langsung ke tabel `members`
(nama, email Google, role `bendahara`) — setelah itu login Google untuk
email tersebut langsung aktif, dan anggota berikutnya bisa ditambah dari
halaman **Pengaturan**.

## Verifikasi

```bash
pnpm typecheck
pnpm test    # unit test finance (fixture rekonstruksi laporan 10 Nov 2026)
             # + uji migrasi di PGlite (bukan Postgres server)
pnpm build
```

## Deploy (pola GHCR pull)

Image dibangun di CI, VPS hanya `docker compose pull && docker compose up -d`
(lihat `docker-compose.yml`). Tidak ada secret di build args; semua env
dibaca saat runtime. Halaman yang membaca DB bersifat `force-dynamic` dan
menampilkan keadaan kosong yang aman bila DB belum tersedia.
