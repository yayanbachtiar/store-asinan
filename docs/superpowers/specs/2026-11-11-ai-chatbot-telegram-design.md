# Design Spec: AI Chatbot (Web Dashboard) & Telegram Bot via 9Router

## 1. Intent & Why
Memudahkan tim operasional Asinan melihat insight keuangan, mengecek transaksi, dan bertanya tentang kondisi bisnis langsung dari dua channel:
1. **Web Dashboard**: Chatbot interaktif bertema Sakura Pink dengan maskot Chibi Pisang.
2. **Telegram Bot**: Asisten bot on-the-go via Telegram dengan long polling (tanpa perlu domain/ngrok), ditenagai AI combo `kimi` melalui 9Router.

---

## 2. Arsitektur & Komponen

### A. AI Client & Store Context Helper (`src/lib/ai-client.ts`)
- Standar OpenAI-compatible endpoint ke 9Router:
  - Base URL: `NINEROUTER_BASE_URL` (default: `http://localhost:20127/v1`)
  - API Key: `NINEROUTER_API_KEY` (default: `sk-5ec8186a854f88fa-695xy3-89481bfb`)
  - Model: `NINEROUTER_MODEL` (default: `kimi`)
- Context builder: Mengambil ringkasan batch aktif dari Firestore (omset, modal, laba kotor, sisa piutang, daftar produk, transaksi terkini) untuk diinjeksikan ke system prompt.

### B. Web AI Chatbot
- **API Route**: `src/app/api/chat/route.ts`
  - Proteksi sesi login (cookie auth).
  - Menerima `messages: Array<{ role: 'user' | 'assistant', content: string }>`.
  - Mengembalikan respons streaming atau JSON dari 9Router.
- **Frontend Component**: `src/components/AiChatBubble.tsx`
  - Dimuat di `src/app/(dashboard)/layout.tsx`.
  - Floating button di pojok kanan bawah (z-index tinggi, responsif di desktop & mobile).
  - Tampilan Sakura Pink & Cream:
    - Avatar Chibi Banana Mascot dengan status "Online".
    - Quick prompt chips: "Berapa omset batch aktif?", "Ada piutang siapa saja?", "Saran harga / promo".
    - Kotak input dengan tombol kirim bertema rose gradient.

### C. Telegram Bot (Long Polling)
- **Script**: `scripts/telegram-bot.ts`
  - Berjalan mandiri dengan `tsx scripts/telegram-bot.ts` (alias `pnpm run telegram:bot`).
  - Menggunakan native `fetch` polling (`getUpdates`), tanpa perlu dependency berat atau tunneling ngrok.
  - Env vars:
    - `TELEGRAM_BOT_TOKEN`
    - `TELEGRAM_ALLOWED_USERS` (opsional: whitelist ID telegram user/chat agar aman).
  - Fitur:
    - `/start` atau `/help`: Sambutan dan daftar perintah.
    - `/status` atau `/omset`: Ringkasan instan batch aktif (angka riil dari database).
    - `/piutang`: Daftar nama pelanggan yang belum lunas beserta nominal.
    - Pertanyaan bebas (natural language): Dijawab oleh AI model `kimi` dengan konteks keuangan terkini.

---

## 3. Environment Variables
Tambahan di `.env` dan `.env.example`:
```env
# 9Router AI Gateway
NINEROUTER_BASE_URL=http://localhost:20127/v1
NINEROUTER_API_KEY=sk-5ec8186a854f88fa-695xy3-89481bfb
NINEROUTER_MODEL=kimi

# Telegram Bot
TELEGRAM_BOT_TOKEN=
TELEGRAM_ALLOWED_USERS=
```

---

## 4. Keamanan & Batasan
- Chatbot web hanya dapat diakses oleh user terautentikasi (cookie sesi aktif).
- Telegram bot mendukung whitelist user ID agar data keuangan toko tidak diakses pihak luar.
- Tanpa dependensi pihak ketiga baru (cukup native Node.js `fetch` yang sudah didukung di Next.js & Node 20+).
