# Design Document: Cute & Agentic Financial Command Center UI/UX

- **Date:** 2026-11-11
- **Status:** Proposed / Ready for User Approval
- **Topic:** Redesign UI/UX Financial Command Center — Girly, Sakura Pink & Cream Minimalist Theme with Agentic Finance Advisor

---

## 1. Intent & The Why

Aplikasi internal operasional kas dan penjualan asinan membutuhkan antarmuka yang cepat diakses untuk kasir/admin, namun juga menyenangkan dan memotivasi pengguna harian (*girly, cute, aesthetic*).

Berdasarkan benchmark aplikasi keuangan **Money+ Cute Expense Tracker (`com.zotiger.accountbook`)**, antarmuka pencatatan keuangan tidak harus dingin dan kaku seperti spreadsheet korporat. Melalui perpaduan palet warna **Sakura Pink & Warm Cream**, kartu membulat yang bersih (*minimalist & clean*), serta integrasi **AI Financial Advisor (Cute Agentic Assistant)**, pengguna tidak hanya mencatat angka harian dengan cepat, tetapi juga dibimbing oleh asisten cerdas dalam:
1. Menentukan harga jual per cup yang optimal berdasarkan modal belanja bahan, target laba, dan estimasi *effort*/tenaga kerja.
2. Memantau titik impas (Break-Even Point / BEP) secara real-time pada batch yang sedang berjalan.
3. Mendapatkan saran operasional proaktif (*proactive financial tips*) yang ramah dan memotivasi.

---

## 2. Design Persona & Vibe

- **Target Persona:** Admin/kasir yang menyukai hal-hal lucu, rapi, estetik (*girly & clean*), menghargai kemudahan input tanpa ribet.
- **Visual Vibe:** *Warm, airy, gentle, and uncluttered*. Terinspirasi dari gaya digital planner Jepang/Korea dan Money+:
  - Latar belakang putih susu hangat (*Warm Cream/Milk White*).
  - Aksen utama *Sakura Rose & Strawberry Pink* yang lembut namun jelas terbaca.
  - Sudut membulat lapang (`rounded-2xl` sampai `rounded-3xl`), bayangan pastel tipis (*diffused soft shadow*), dan *border* bernuansa blush tipis.
- **Agent Voice:** Ramah, cerdas, menggemaskan, suportif, dan bebas istilah finansial yang kaku (*"Halo Kak! Belanja batch ini Rp 120.000. Jual 10 cup lagi sudah balik modal lho 🌸"*).

---

## 3. Visual Tokens & Color Palette

### 3.1. Color Tokens (Sakura Pink & Cream Theme)
```css
/* Base Canvas */
--bg-cream: #FFFDF9;            /* Warm milk cream background */
--bg-cream-subtle: #FFF8F6;     /* Secondary section background */
--surface-card: #FFFFFF;        /* Clean white card surface */
--border-pink-soft: #FDE8ED;    /* Subtle blush card border */
--border-pink-focus: #F472B6;   /* Active border / ring */

/* Primary Accents (Sakura / Strawberry Pink) */
--pink-primary: #F43F5E;        /* Rose / vibrant sakura for main CTAs */
--pink-hover: #E11D48;          /* Hover state */
--pink-light: #FFE4E9;          /* Button/chip background light */
--pink-subtle: #FFF1F3;         /* Very soft pink tint for badges */

/* Secondary Accents (Pastel Harmony) */
--accent-butter: #FEF3C7;       /* Honey/butter yellow for tempo/pending & warning */
--accent-butter-text: #B45309;
--accent-mint: #D1FAE5;         /* Sweet mint for lunas / success / profit */
--accent-mint-text: #065F46;
--accent-lavender: #EDE9FE;     /* Soft lilac for AI Agent / Advisor badges */
--accent-lavender-text: #5B21B6;

/* Neutral Typography */
--text-main: #2D1B2D;           /* Deep soft chocolate plum (warmer than slate-900) */
--text-secondary: #7A6273;      /* Muted rosy grey for labels */
--text-muted: #A892A2;          /* Light muted timestamp/helper */
```

### 3.2. Typography & Shapes
- **Font:** Rounded modern sans (`'Quicksand'`, `'Nunito'`, atau `system-ui` dengan bobot membulat dan *letter-spacing* lapang).
- **Radius:**
  - Card/Container: `rounded-3xl` (24px) untuk kartu besar, `rounded-2xl` (16px) untuk modal/tabel.
  - Buttons & Chips: `rounded-full` (pill shape) untuk tombol aksi, filter, dan chip produk.
- **Shadows:** *Soft diffused pastel glow* (`box-shadow: 0 10px 25px -5px rgba(244, 63, 94, 0.08), 0 8px 10px -6px rgba(244, 63, 94, 0.04)`).

---

## 4. Architecture: Layout & Komponen Utama

### 4.1. Header & Cute Status Bar (`layout.tsx`)
- Logo: `🍓 Kas Asinan` dengan tipografi hangat.
- Role Badge: *Pill* manis berwarna lavender (`bg-purple-100 text-purple-700 font-semibold`) bertuliskan *"👑 Bendahara"* atau *"🌸 Anggota"*.
- Desktop Nav: Pill membulat (`rounded-full`) dengan efek hover pink pastel halus.
- Mobile Nav: *Floating bottom bar* membulat (`rounded-t-3xl border-t border-pink-100 bg-white/95 backdrop-blur-md`).

### 4.2. Zona AI — Cute Financial Advisor Bar (Baru ✨)
Diletakkan di bagian atas dashboard, tepat di bawah judul:
- **Card:** `bg-gradient-to-r from-pink-50/80 via-purple-50/50 to-amber-50/50 border border-pink-200/60 rounded-3xl p-4 shadow-sm`.
- **Avatar:** Maskot bulat imut beranimasi lembut (`🌸` / `✨` / `🎀` atau avatar robot pastel).
- **Proactive AI Insight:**
  - Menampilkan ringkasan pintar satu kalimat: *"Batch hari ini sudah mencatat modal belanja Rp 135.000. Cukup jual 9 cup lagi (Rp 15.000) untuk balik modal (BEP)! 💖"*
- **Tombol Pintar (Agentic Tools):**
  - `💡 Rekomendasi Harga`: Membuka modal kalkulator harga cerdas.
  - `📊 Analisis BEP & Margin`: Menghitung potensi profit berdasarkan skenario porsi.
  - `⏱️ Hitung Effort/Tenaga`: Memperhitungkan waktu kerja ke HPP.

### 4.3. Zona 1 — Cute KPI Summary Cards
Empat kartu ringkasan berlatar putih dengan sentuhan pastel individual:
1. **Omset Batch:** Latar gradasi *Blush Pink* tipis, ikon `💖`, nominal besar berbobot tebal, sub-teks *badge* `"X order lunas"`.
2. **Piutang (Tempo):** Latar gradasi *Warm Honey* tipis, ikon `🍯`, status order belum lunas dengan peringatan ramah.
3. **Porsi / Cup Terjual:** Latar gradasi *Berry Lavender*, ikon `🍧`, menghitung total akumulasi cup terjual dari batch aktif.
4. **Laba Bersih Riil:** Latar gradasi *Sweet Mint*, ikon `🍀`, kalkulasi laba bersih (omset - belanja bahan) disertai persentase *margin*.

### 4.4. Zona 2 — Quick Action Bar
- **Batch Info:** Tanggal batch, status aktif dengan titik *sakura pulsing*, dan modal awal.
- **Tombol Aksi Utama:**
  - `✨ + Catat Penjualan`: Pill pink ceria (`bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-md shadow-pink-200 hover:brightness-105 active:scale-95`).
  - `🧺 - Belanja Bahan`: Pill cream pastel (`bg-white border-2 border-pink-200 text-pink-700 hover:bg-pink-50 active:scale-95`).
  - `💡 Konsul Advisor`: Tombol khusus untuk bertanya/mengecek kalkulasi harga jual instan.

### 4.5. Zona 3 — Clean & Cute Transaction Table
- **Tab Switcher:** Berbentuk *capsule pill* (`bg-pink-100/70 p-1 rounded-full`).
  - Tab 1: `Penjualan (N)`
  - Tab 2: `Belanja Bahan (N)`
- **Search Bar:** Input membulat dengan ikon kaca pembesar dan teks *placeholder* ramah.
- **Filter Pills:** `Semua`, `💖 Lunas`, `⏳ Belum Bayar`.
- **Gaya Baris Tabel / List:**
  - Setiap baris memiliki sudut membulat, spasi nyaman (*clean padding*).
  - Terdapat ikon kategori bulat pastel di samping nama pelanggan (`💬` WA, `🏥` Puskesmas, `🛍️` Stand).
  - Kolom cup dan nominal berformat rapi dengan warna teks tegas dan mudah dibaca.
  - Tombol pelunasan cepat: Tombol imut `"✨ Lunasi"` (1-klik lunas tunai).

### 4.6. Modal Cepat Bergaya Sticker & Cute Receipt
1. **`QuickOrderModal.tsx`**:
   - Produk ditampilkan dalam *Sticker Chips* pastel yang membal saat diklik (*bouncy transition*).
   - Saat dipilih, muncul badge kuantitas bulat pink di pojok chip.
   - Ringkasan pesanan berbentuk *Cute Receipt* dengan batas garis putus-putus (*dashed line*) dan subtotal otomatis.
   - Toggle pelanggan baru yang mulus tanpa pindah halaman.
   - Opsi pembayaran langsung lunas dengan checkbox estetik.
2. **`QuickExpenseModal.tsx`**:
   - Input nominal rupiah otomatis terformat (`formatRupiahInput`).
   - Pilihan anggota yang menalangi belanja bahan dengan badge inisial avatar.

---

## 5. Agentic AI Financial Advisor Specifications

### 5.1. Fitur 1: AI Smart Pricing & Effort Calculator
Formulasi harga jual asinan yang tidak sekadar mengira-ngira, melainkan memperhitungkan:
$$\text{HPP Bahan per Cup} = \frac{\text{Total Belanja Bahan}}{\text{Target Estimasi Cup}}$$
$$\text{Biaya Tenaga/Effort per Cup} = \frac{\text{Jam Kerja} \times \text{Tarif Jam Tenaga Kerja}}{\text{Target Estimasi Cup}}$$
$$\text{HPP Total} = \text{HPP Bahan per Cup} + \text{Biaya Tenaga per Cup} + \text{Biaya Kemasan (Cup, Sendok, Plastik)}$$
$$\text{Rekomendasi Harga Jual} = \frac{\text{HPP Total}}{1 - \text{Target Margin}}$$

**Interaksi UI:**
- Pengguna memasukkan total belanja bahan (bisa ditarik otomatis dari `expenses` batch aktif), target cup (misal 30 cup), dan tingkat *effort* (misal: 3 jam produksi).
- AI Advisor memberikan 3 pilihan rekomendasi cerdas:
  - 🌸 **Harga Ramah (Margin 30%)**: Cocok untuk promosi awal.
  - 💖 **Harga Ideal (Margin 45%)**: Rekomendasi terbaik untuk keberlanjutan kas dan laba bersih.
  - 👑 **Harga Premium (Margin 60%)**: Jika porsi ekstra atau ada topping spesial.

### 5.2. Fitur 2: Batch BEP (Break-Even Point) Forecaster
- Menghitung otomatis: Berapa cup yang harus terjual untuk menutup seluruh biaya belanja bahan batch hari ini:
$$\text{BEP (Cup)} = \lceil \frac{\text{Total Belanja Bahan}}{\text{Harga Rata-rata per Cup}} \rceil$$
- Menampilkan *progress bar* lucu bertema pelangi/sakura:
  - Contoh: `"Target BEP: 10 Cup (Tercapai: 7/10 Cup) 🍧 — Butuh 3 cup lagi untuk balik modal!"`.

### 5.3. Fitur 3: Extensible AI Endpoint (`/api/ai/advisor`)
- Komponen frontend dapat memanggil kalkulasi lokal secara instan (0ms latency).
- Menyediakan endpoint `/api/ai/advisor` yang dapat diintegrasikan dengan Google Gemini API (model `gemini-1.5-flash` atau sejenis) untuk memberikan evaluasi performa penjualan dan tips optimasi belanja bahan batch berikutnya.

---

## 6. Implementation Plan Breakdown

1. **Phase 1: Visual Tokens & Styling Overhaul**
   - Perbarui `src/app/globals.css` dengan variabel tema Sakura Pink & Cream (`--bg-cream`, `--pink-primary`, dll.).
   - Perbarui `src/app/(dashboard)/layout.tsx` (header, role badge, nav pills, mobile dock).
   - Perbarui `src/components/ui.tsx` (`StatCard` dengan warna pastel & icon bubble).

2. **Phase 2: AI Financial Advisor Module**
   - Buat logic kalkulator finansial di `src/lib/financial-advisor.ts` (HPP, effort, BEP, smart pricing).
   - Buat komponen `src/components/command-center/AiAdvisorBanner.tsx` (insight bar proaktif di atas dashboard).
   - Buat komponen `src/components/command-center/AiPricingAdvisorModal.tsx` (modal kalkulator harga & BEP).

3. **Phase 3: Cute Command Center & Modals**
   - Perbarui `src/components/command-center/CommandCenterView.tsx` (hubungkan AI Advisor Banner & Action Bar).
   - Perbarui `src/components/command-center/QuickOrderModal.tsx` (sticker chips produk, cute receipt design).
   - Perbarui `src/components/command-center/QuickExpenseModal.tsx` (warm blush styling, rupiah auto-format).
   - Perbarui `src/components/command-center/TransactionTable.tsx` (cute capsule tabs, avatar badge pelanggan, tombol lunasi imut).

4. **Phase 4: Dashboard Page Integration & Testing**
   - Integrasikan ke `src/app/(dashboard)/page.tsx`.
   - Tambahkan unit test untuk kalkulasi finansial di `tests/financial-advisor.test.ts`.
   - Verifikasi build `pnpm build` dan pastikan semua fungsionalitas CRUD batch, order, dan payment tetap 100% kompatibel.
