/**
 * Helper otorisasi dan format pesan untuk Runner Bot Telegram Toko Asinan
 */

export function cleanTelegramHandle(raw) {
  if (!raw) return "";
  return String(raw).trim().toLowerCase().replace(/^@/, "");
}

export async function authorizeTelegramUser(user, db, fallbackAllowedUsers = "") {
  const userIdStr = String(user.id);
  const usernameClean = cleanTelegramHandle(user.username);

  // 1. Cek Firestore members yang aktif
  if (db && typeof db.collection === "function") {
    try {
      const snap = await db.collection("members").where("isActive", "==", true).get();
      for (const doc of snap.docs) {
        const m = doc.data();
        if (!m.telegramId) continue;
        const memberTg = cleanTelegramHandle(m.telegramId);
        if (memberTg === userIdStr || (usernameClean && memberTg === usernameClean)) {
          return {
            authorized: true,
            member: {
              id: doc.id,
              name: m.name,
              role: m.role,
              telegramId: m.telegramId,
            },
          };
        }
      }
    } catch (err) {
      console.warn("⚠️ Gagal query anggota Firestore:", err.message);
    }
  }

  // 2. Fallback ke TELEGRAM_ALLOWED_USERS di .env jika ada
  if (fallbackAllowedUsers && fallbackAllowedUsers.trim()) {
    const allowed = fallbackAllowedUsers
      .split(",")
      .map(cleanTelegramHandle)
      .filter(Boolean);
    if (allowed.includes(userIdStr) || (usernameClean && allowed.includes(usernameClean))) {
      return { authorized: true, member: null };
    }
  }

  return { authorized: false, member: null };
}

export function formatUnauthorizedMessage(user) {
  return `⛔ *Akses Ditolak*\n\nAkun Telegram Anda belum terhubung ke sistem Kas Asinan.\n*ID Telegram Anda:* \`${user.id}\`\n\n📌 *Cara Menghubungkan:*\n1. Buka Dashboard Kas Asinan di browser Anda\n2. Masuk ke menu *Pengaturan* > *Akun Telegram Saya*\n3. Masukkan ID \`${user.id}\` pada formulir lalu klik *Simpan ID*\n\nSetelah disimpan, Anda langsung dapat bertanya apa saja ke bot ini! 🍌`;
}
