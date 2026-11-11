# Design Document: Financial Command Center UI/UX Revamp

- **Date:** 2026-11-11
- **Status:** Approved by Builder Check / Ready for User Approval
- **Topic:** Financial Command Center UI/UX Revamp for Internal Store Operations

---

## 1. Intent & The Why

Aplikasi internal operasional penjualan asinan membutuhkan antarmuka yang cepat diakses, minim klik, dan mengutamakan kejelasan angka. Saat ini, pencatatan transaksi mengharuskan pengguna membuka menu Batch terlebih dahulu lalu navigasi ke detail batch, dengan form input standar di bawah tabel.

Revamp ini mengubah halaman utama (`/`) menjadi **Financial Command Center** yang terhubung langsung ke batch aktif, memungkinkan pencatatan pesanan dan belanja bahan dalam hitungan detik melalui modal cepat dengan format mata uang otomatis dan tombol chip produk instan.

---

## 2. Goals, Non-Goals & Anti-Goals

### Goals
1. **Financial Command Center di Dashboard Utama (`/`)**:
   - Memuat batch aktif secara otomatis. Jika tidak ada batch aktif, tampilkan fallback ringkas untuk membuat atau mengaktifkan batch.
2. **Zona 1 — KPI Summary Cards**:
   - Tiga kartu utama: **Omset Batch**, **Piutang (Belum Bayar)**, dan **Porsi/Cup Terjual** (dengan sub-teks laba & margin).
3. **Zona 2 — Quick Action Bar**:
   - Tombol aksi utama: `+ Catat Penjualan` (hijau emerald) dan `- Catat Belanja Bahan` (slate/outline) yang memicu modal instan.
   - Filter cepat tab untuk tabel transaksi: *Semua*, *Lunas*, *Belum Bayar (Tempo)*, serta tab *Belanja Bahan*.
4. **Zona 3 — Data-Dense Table Transaksi**:
   - Teks nama pelanggan/keterangan rata kiri, kuantitas & nominal Rupiah rata kanan sejajar vertikal.
   - Baris tabel rapat (compact ~12px padding) dengan zebra striping halus (`bg-white` & `bg-slate-50/50`).
   - Status badge menggunakan pill warna solid lembut (hijau mint/emerald untuk *Lunas*, amber/kuning untuk *Belum Bayar*).
   - Tombol pelunasan cepat untuk transaksi berstatus belum bayar.
5. **Form Input Cepat (Modal)**:
   - Auto-formatting angka ribuan (`150000` -> `Rp 150.000`) pada input uang (belanja bahan dan pelunasan).
   - Quick chips untuk seluruh produk aktif (klik chip langsung tambah item/qty tanpa ketik).
   - Opsi "Langsung Lunas" (default: tunai & diterima oleh anggota yang sedang login).
6. **Pembaruan Visual Tokens**:
   - Background utama: `#F8FAFC` (Slate 50).
   - Card surface: Bersih dengan border halus `slate-200` dan soft frosted effect.
   - Primary accent: Emerald / Mint Green (`#059669` / `#10B981`) menggantikan tema dominan amber.

### Non-Goals
- Tidak mengubah skema data Firestore maupun kontrak API backend `/api/*`.
- Tidak membuat modul stok fisik inventaris gudang yang terpisah (total porsi/cup dihitung langsung dari akumulasi `qty` item produk pada order batch aktif).

### Anti-Goals
- Tidak menambah alur klik navigasi baru untuk sekadar mencatat transaksi harian.
- Tidak merusak halaman manajemen detail batch `/batch/[id]` yang sudah ada.

---

## 3. Constraints

- Framework: Next.js 15 (App Router, React 19).
- Styling: Tailwind CSS v4 (`@import "tailwindcss"`).
- Database: Google Cloud Firestore (dibaca via repository pattern di `src/lib/repo/*` dan `src/lib/data.ts`).
- Semua transaksi (orders, expenses, payments) tetap wajib memiliki relasi `batchId` yang valid.

---

## 4. Approaches Considered

### Approach 1: Command Center Langsung di Dashboard Utama (`/`) — DIPILIH
- Mengubah `src/app/(dashboard)/page.tsx` menjadi Financial Command Center penuh yang membaca data batch aktif dan menyediakan quick actions langsung.
- **Kelebihan**: Alur kerja tercepat bagi kasir/admin. Sekali buka aplikasi, langsung bisa mencatat dan memantau status kasir hari itu.
- **Kekurangan**: Halaman utama kini memuat data order batch aktif selain ringkasan metrik.

### Approach 2: Command Center di Dalam Detail Batch (`/batch/[id]`) — DITOLAK
- Mempertahankan `/` hanya sebagai halaman statistik multi-batch dan memindahkan desain Command Center ke dalam `/batch/[id]`.
- **Alasan Ditolak**: Menambah gesekan klik operasional harian. Kasir harus navigasi: Menu Batch -> Pilih Batch -> Baru bisa input.

---

## 5. Architectural & Component Design

### 5.1. Komponen & Alur
1. **Tema Global (`src/app/globals.css` & `src/app/(dashboard)/layout.tsx`)**:
   - Ubah tema dasar ke Slate 50 (`bg-slate-50 text-slate-900`) dan navigasi aktif menggunakan aksen emerald (`#059669`).
2. **Komponen Command Center (`src/components/command-center/`)**:
   - `CommandCenterView.tsx`: Komponen wrapper interaktif untuk mengelola state modal (Order Modal & Expense Modal) serta filter tab transaksi.
   - `QuickOrderModal.tsx`:
     - Modal dialog cepat untuk catat pesanan.
     - Chip produk aktif untuk memilih item dan menambah kuantitas.
     - Ringkasan item dan kalkulasi total otomatis dalam format Rupiah.
     - Checkbox "Langsung Lunas": jika dicentang, sistem otomatis memanggil `POST /api/orders` lalu `POST /api/payments` dengan metode tunai dan penerima kasir login.
   - `QuickExpenseModal.tsx`:
     - Modal pencatatan pengeluaran operasional / belanja bahan baku.
     - Input nominal uang dengan auto-formatting ribuan (`Rp ...`).
   - `TransactionTable.tsx`:
     - Menampilkan riwayat order batch aktif dengan filter: *Semua*, *Lunas*, *Belum Bayar*, dan tab *Belanja Bahan*.
     - Layout tabel rapat, angka nominal rata kanan.
     - Tombol pelunasan cepat 1-klik untuk order yang belum lunas.
3. **Dashboard Utama (`src/app/(dashboard)/page.tsx`)**:
   - Server Component yang memuat data batch aktif via `getBatchDetail`, data master pelanggan, produk, dan anggota.
   - Merender Zona 1 (KPI Cards), Zona 2 (Quick Action Bar), dan Zona 3 (Transaction Table).

---

## 6. Settle Calls from Builder Check
1. **Scope Zona 3**: Menggunakan sistem tab di atas tabel (`Penjualan (Order)` dan `Belanja Bahan`). Default tab aktif adalah `Penjualan` dengan filter pill (`Semua`, `Lunas`, `Belum Bayar`), sedangkan tab `Belanja Bahan` menampilkan daftar pengeluaran batch dengan tombol hapus.
2. **Input Nominal di Order Modal**: Total order dihitung otomatis dari `qty * harga produk`. Auto-formatting rupiah digunakan pada input uang di `QuickExpenseModal` dan saat memasukkan nominal pembayaran kustom.
3. **Alur Langsung Lunas**: Dijalankan secara sekuensial (panggil `POST /api/orders`, lalu `POST /api/payments` memakai `id` order yang baru dibuat, `method: "cash"`, dan penerima kasir yang login).
4. **Formula Cup Terjual**: Dihitung dari `sum(items.qty)` pada semua order batch aktif.
5. **Quick Chips Produk**: Menampilkan semua produk berstatus aktif (`isActive !== false`), diurutkan berdasarkan nama.
6. **Pelunasan Cepat**: Tombol "Lunasi" pada tabel memunculkan popover kecil / konfirmasi dengan nominal lunas default tunai ke kasir login.
