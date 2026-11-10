# Kas Asinan — Pencatatan Order & Keuangan

Aplikasi untuk tim usaha asinan (5 orang): pencatatan order, pengeluaran
produksi per batch, pembayaran, piutang, setoran ke bendahara, talangan
modal, alokasi laba, dan ROI per batch. Dashboard adalah inti; Telegram/AI
adalah tahap berikutnya (agent pembantu), belum termasuk di MVP ini.

Prinsip penting:
- **Status BAYAR ≠ status SETOR** — pelanggan bisa sudah bayar ke anggota,
  tapi uangnya belum tentu sudah disetor ke bendahara.
- Semua angka dihitung deterministik di `src/lib/finance.ts` (murni, teruji).
  Rekonsiliasi yang selalu klop: `omzet = kas bendahara + belum disetor + piutang`.

## Stack (keputusan user, 10 Nov 2026)

Next.js 16 (App Router, TypeScript) · Tailwind CSS 4 · **Google Cloud Run** ·
**Firebase Firestore** (data) · **Firebase Authentication** (login Google) ·
pnpm. Tidak ada VPS dan tidak ada PostgreSQL.

### Model data Firestore

Satu collection per entitas, satu dokumen per baris data:
`members`, `customers`, `products`, `batches`, `expenses`, `orders`,
`payments`, `settlements`, `advances`, `profit_allocations`, `ai_usage`,
`audit_log`. Keputusan desain:

- **Item order tertanam** sebagai array `items` di dokumen `orders`
  (bukan collection terpisah) — atomik dan pas untuk skala ini.
- **Denormalisasi**: `payments` menyimpan `batchId` (disalin dari order)
  agar pembayaran per batch bisa dibaca tanpa join.
- **Agregasi laporan dihitung di aplikasi**: dokumen per batch dibaca lalu
  dihitung oleh `lib/finance.ts` di server — tidak ada query agregat.
  Ini layak **karena** skalanya kecil (5 pengguna, ±30 order/batch);
  bila suatu hari order mencapai ribuan per batch, pola ini perlu ditinjau.
- Uang selalu integer Rupiah. Tanggal batch disimpan string `YYYY-MM-DD`,
  timestamp sebagai string ISO.
- Firestore tidak punya unique constraint / foreign key / cascade —
  keunikan email anggota & nama produk, pencegahan hapus pelanggan yang
  punya order, dan cascade hapus pembayaran saat order dihapus dijaga di
  lapisan aplikasi (route API + repository di `src/lib/repo/`).
- Akses Firestore hanya dari server lewat Firebase Admin SDK. Di Cloud Run
  kredensialnya adalah service account bawaan runtime — **tanpa file kunci**.

### Auth

Login Google memakai **Firebase Authentication**: browser
`signInWithPopup` → ID token → `POST /api/auth/firebase` memverifikasi token
via Admin SDK → email harus **sudah terdaftar & aktif** di collection
`members` (whitelist, tanpa auto-provisioning, tanpa akun demo) → cookie
sesi HMAC berisi member id.

## Persiapan dari nol (dilakukan user, sekali saja)

1. **Buat project Firebase** di https://console.firebase.google.com
   (project ini sekaligus project GCP-nya).
2. **Aktifkan Firestore**: Build → Firestore Database → Create database →
   mode **Production** (pilih region dekat Indonesia bila ditawarkan).
3. **Aktifkan login Google**: Build → Authentication → Sign-in method →
   Google → Enable.
4. **Daftarkan aplikasi Web**: Project settings → General → Your apps →
   Web (`</>`) → salin konfigurasi `apiKey`, `authDomain`, `projectId`,
   `messagingSenderId`, `appId` untuk langkah deploy.
5. **Buat secret sesi**: buat string acak panjang, simpan di Secret Manager:
   ```bash
   gcloud secrets create kas-asinan-session-secret --data-file=- <<< "STRING_ACAK_PANJANG"
   ```
   dan beri akses ke service account Cloud Run
   (`roles/secretmanager.secretAccessor` untuk
   `<project-number>-compute@developer.gserviceaccount.com`).
6. **Buat anggota pertama (bendahara)** langsung di Firestore Console:
   collection `members`, satu dokumen (Document ID: auto), field persis:
   | field | type | nilai contoh |
   |---|---|---|
   | `name` | string | `Wening` |
   | `email` | string | email Google bendahara (huruf kecil) |
   | `telegramId` | null | (belum dipakai) |
   | `role` | string | `bendahara` |
   | `isActive` | boolean | `true` |
   | `createdAt` | string | `2026-11-10T00:00:00.000Z` |
7. **Deploy** (satu perintah — butuh `gcloud` yang sudah login ke project):
   ```bash
   GCP_PROJECT_ID=<project-id> \
   NEXT_PUBLIC_FIREBASE_API_KEY=<apiKey> \
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=<project-id>.firebaseapp.com \
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=<senderId> \
   NEXT_PUBLIC_FIREBASE_APP_ID=<appId> \
   bash scripts/deploy-cloudrun.sh
   ```
   Script membangun image via Cloud Build (region `asia-southeast2`),
   lalu `gcloud run deploy kas-asinan --allow-unauthenticated
   --min-instances 0 --max-instances 3` dengan env `FIREBASE_PROJECT_ID`
   dan `SESSION_SECRET` dari Secret Manager. `--allow-unauthenticated`
   hanya membuka akses di tingkat Cloud Run; otorisasi tetap ditangani
   aplikasi (semua halaman/API menolak tanpa sesi anggota).
8. **Setelah URL Cloud Run keluar** (format
   `https://kas-asinan-xxxxx-xx.a.run.app`):
   - Tambahkan domain itu ke Firebase Console → Authentication → Settings →
     **Authorized domains**.
   - Seed produk awal: `FIREBASE_PROJECT_ID=<project-id> pnpm seed:products`
     (butuh kredensial lokal: `gcloud auth application-default login`,
     atau jalankan saat emulator dipakai).
   - Login sebagai bendahara → tambahkan 4 anggota lain di halaman
     **Pengaturan**.

Deploy ulang berikutnya cukup langkah 7. Jalur GitHub Actions
(`.github/workflows/deploy-cloudrun.yml`, manual `workflow_dispatch`)
tersedia sebagai opsi; CI (`ci.yml`) hanya menjalankan typecheck+test+build.

## Jalan lokal

```bash
pnpm install
cp .env.example .env
# Pilihan A — Firestore Emulator (tanpa project asli):
#   firebase emulators:start --only firestore   (di terminal lain)
#   lalu set FIRESTORE_EMULATOR_HOST=localhost:8080 & FIREBASE_PROJECT_ID=demo-kas-asinan
# Pilihan B — Firestore asli: gcloud auth application-default login
#   lalu set FIREBASE_PROJECT_ID=<project-id>
pnpm seed:products
pnpm dev
```

Bila konfigurasi Firebase belum diisi sama sekali, aplikasi tetap jalan:
halaman login menampilkan tombol nonaktif + penjelasan, dan halaman
dashboard menampilkan keadaan "database belum tersedia" (build tidak gagal).

## Verifikasi

```bash
pnpm typecheck
pnpm test    # 12 test finance murni (fixture rekonstruksi laporan 10 Nov 2026)
             # + 4 test repository di atas fake Firestore in-memory
             # (bukan Firestore asli / bukan emulator — bukti final di deploy pertama)
pnpm build
```
