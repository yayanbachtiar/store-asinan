# Self-Serve Telegram User ID Linking & Dynamic Bot Authorization Design

## 1. Intent & Why
Admin/team members who login to Kas Asinan dashboard need to link their Telegram account self-service without touching server `.env` files. In addition, users need clear, step-by-step guidance on how to obtain their numeric Telegram User ID. The Telegram Bot daemon will authorize users dynamically against active team members in Firestore, greeting them by name and rejecting unauthorized users with their ID and instructions.

## 2. Goals & Non-Goals

### Goals
1. **Self-Serve Linking in `/pengaturan`**:
   - Provide a dedicated card "Akun Telegram Saya" for the logged-in member.
   - Show current link status: Connected (`@username` or `123456789`) or Unlinked.
   - Allow entering/updating/disconnecting Telegram ID.
   - Explain how to find Telegram ID (Method 1: chat directly to Asinan Bot to see your ID; Method 2: check `@userinfobot`).
2. **API Endpoint**:
   - `PATCH /api/members/me`: Accepts `{ telegramId: string | null }`, updates current user's document in Firestore. Sanitizes input (strips `@`, trims). Ensures uniqueness across members.
3. **Dynamic Bot Authorization**:
   - In `scripts/telegram-bot.mjs`, dynamically check Firestore `members` for any active member (`isActive: true`) whose `telegramId` matches the sender's Telegram numeric `id` or `username` (case-insensitive).
   - Retain `process.env.TELEGRAM_ALLOWED_USERS` as an optional fallback.
   - For unauthorized messages, reply with:
     *"⛔ Akses Ditolak. Akun Telegram Anda (ID: `123456789`) belum terhubung ke Kas Asinan. Silakan login ke Dashboard > Pengaturan > Akun Telegram Saya, lalu masukkan ID Anda."*

### Non-Goals
- Telegram Login Widget (Google Auth is already standard for dashboard login).
- Arbitrary role changes via Telegram.

## 3. Approaches Considered

1. **Approach A: Static `.env` List**
   - *Pros:* Zero Firestore lookup on auth.
   - *Cons:* Admin must modify `.env` and restart bot daemon for every new team member. Rejected per user request.
2. **Approach B: Global Whitelist Table in Settings**
   - *Pros:* Centralized list.
   - *Cons:* Only admin/bendahara can edit; regular members cannot self-serve.
3. **Approach C: Self-Serve Profile Linking + Dynamic Firestore Authorization (Selected)**
   - *Pros:* Directly aligns with user requirement ("user set sendiri userid nya after login"). Zero friction for onboarding members.

## 4. Technical Architecture & Interfaces

### Frontend (`src/app/(dashboard)/pengaturan/page.tsx` & `src/components/forms.tsx`)
- `TelegramSelfLinkCard`:
  - Fetches or receives current member's `telegramId`.
  - Input field with placeholder `Contoh: 123456789 atau username`.
  - Helper accordion/guide:
    - 💡 **Cara Cepat**: Kirim pesan apa saja ke bot Telegram Toko kami (`@<bot_username>`), bot akan otomatis menampilkan ID Telegram Anda.
    - 🔍 **Alternatif**: Gunakan bot `@userinfobot` di Telegram untuk melihat User ID.
  - Buttons: "Simpan Telegram ID", "Putuskan Hubungan" (jika sudah terhubung).

### Backend (`src/app/api/members/me/route.ts`)
- `GET /api/members/me`: Returns `{ id, name, email, role, telegramId }`.
- `PATCH /api/members/me`: Validates body `{ telegramId: z.string().trim().max(64).nullable() }`. Strips leading `@`. Checks if another member uses the same `telegramId`. Updates Firestore `members/{id}`.

### Bot Daemon (`scripts/telegram-bot.mjs`)
- `findActiveMemberByTelegram(db, user)`:
  - Queries Firestore `members` where `isActive == true`.
  - Matches either numeric `user.id` or `user.username`.
- Authorization flow:
  - If member found: Allow, personalized greeting with member's name.
  - Else if matches `TELEGRAM_ALLOWED_USERS` in `.env`: Allow (admin fallback).
  - Else: Send unauthorized guidance message containing user's exact Telegram ID formatted in monospace for 1-tap copy.
