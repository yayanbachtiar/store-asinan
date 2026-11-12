#!/usr/bin/env node

/**
 * Runner Bot Telegram untuk Toko Asinan
 * Terkoneksi ke 9Router (model: kimi) dan Firestore Toko.
 *
 * Menjalankan long-polling Telegram Bot API tanpa dependensi eksternal.
 * Menjalankan: pnpm bot:telegram
 */

import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { authorizeTelegramUser, formatUnauthorizedMessage } from "./telegram-bot-helper.mjs";

// Muat .env di root repo
const envFile = fileURLToPath(new URL("../.env", import.meta.url));
if (existsSync(envFile)) {
  process.loadEnvFile(envFile);
}

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const ALLOWED_USERS = process.env.TELEGRAM_ALLOWED_USERS || "";
const ROUTER_URL = process.env.ROUTER_URL || "http://localhost:20127/v1";
const ROUTER_KEY = process.env.ROUTER_API_KEY || "sk-5ec8186a854f88fa-695xy3-89481bfb";
const ROUTER_MODEL = process.env.ROUTER_MODEL || "kimi";

function printSetupInstructions() {
  console.log(`
========================================================================
⚠️  TELEGRAM_BOT_TOKEN BELUM DIKONFIGURASI DI .env
========================================================================
Untuk menghubungkan Bot Telegram Asinan dengan 9Router (kimi):

1. Buka aplikasi Telegram dan cari @BotFather
2. Kirim perintah: /newbot
3. Beri nama bot (contoh: Toko Asinan AI) dan username (contoh: AsinanStoreBot)
4. Salin HTTP API Token yang diberikan BotFather (contoh: 123456789:ABCdef...)
5. Tambahkan baris ini ke file .env:
   TELEGRAM_BOT_TOKEN="token_anda_disini"
   # Opsional (hanya izinkan ID Telegram tertentu):
   # TELEGRAM_ALLOWED_USERS="123456789,username_anda"

6. Jalankan kembali:
   pnpm bot:telegram
========================================================================
`);
}

async function tgPost(method, payload) {
  const url = `https://api.telegram.org/bot${BOT_TOKEN}/${method}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return res.json();
}

async function getFirestoreInstance() {
  const projectId = process.env.FIREBASE_PROJECT_ID ?? process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const emulatorHost = process.env.FIRESTORE_EMULATOR_HOST;

  if (!projectId && !emulatorHost) return null;

  try {
    const { getApps, initializeApp, applicationDefault } = await import("firebase-admin/app");
    const { getFirestore } = await import("firebase-admin/firestore");

    const app =
      getApps()[0] ??
      initializeApp(
        emulatorHost ? { projectId: "demo-kas-asinan" } : { projectId, credential: applicationDefault() }
      );
    return process.env.FIRESTORE_DATABASE_ID
      ? getFirestore(app, process.env.FIRESTORE_DATABASE_ID)
      : getFirestore(app);
  } catch {
    return null;
  }
}

async function getStoreSnapshot(dbInstance) {
  const db = dbInstance || (await getFirestoreInstance());
  if (!db) {
    return "Status Toko: Data Firestore lokal / Firebase belum dihubungkan.";
  }

  try {

    const batchesSnap = await db.collection("batches").orderBy("createdAt", "desc").limit(3).get();
    if (batchesSnap.empty) {
      return "Status Toko: Belum ada batch produksi tercatat.";
    }

    const batches = batchesSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
    const activeBatch = batches.find((b) => b.status === "aktif") || batches[0];

    const ordersSnap = await db.collection("batches").doc(activeBatch.id).collection("orders").get();
    const orders = ordersSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

    const unpaid = orders.filter((o) => !o.payment);
    const totalUnpaid = unpaid.reduce((sum, o) => {
      const items = o.items || [];
      const orderTotal = items.reduce((s, it) => s + (it.priceSnapshot || 0) * (it.qty || 0), 0);
      return sum + orderTotal;
    }, 0);

    const totalCups = orders.reduce((sum, o) => {
      return sum + (o.items || []).reduce((s, it) => s + (it.qty || 0), 0);
    }, 0);

    let summary = `🍌 *Batch:* ${activeBatch.title || activeBatch.id} (${activeBatch.date || "-"})\n`;
    summary += `*Status:* ${activeBatch.status === "aktif" ? "🟢 Aktif" : "⚪ Ditutup"}\n`;
    summary += `*Cup Terjual:* ${totalCups} cup\n`;
    summary += `*Piutang Belum Lunas:* Rp ${totalUnpaid.toLocaleString("id-ID")} (${unpaid.length} pesanan)\n`;

    if (unpaid.length > 0) {
      summary += `\n*Daftar Piutang:*\n`;
      unpaid.slice(0, 5).forEach((u, idx) => {
        const uTotal = (u.items || []).reduce((s, it) => s + (it.priceSnapshot || 0) * (it.qty || 0), 0);
        summary += `${idx + 1}. ${u.customerName || "Pelanggan"} - Rp ${uTotal.toLocaleString("id-ID")}\n`;
      });
      if (unpaid.length > 5) {
        summary += `...dan ${unpaid.length - 5} pelanggan lainnya.\n`;
      }
    }

    return summary;
  } catch (err) {
    return `Status Toko: Gagal memuat snapshot database (${err.message})`;
  }
}

async function askAi(userMessage, dbInstance) {
  const storeContext = await getStoreSnapshot(dbInstance);

  const systemPrompt = `Kamu adalah Nana (🍌✨), asisten AI maskot pisang toko asinan yang humble, super cute, dan khas personal assistant setia.
Karaktermu:
1. Humble & Rendah Hati: Selalu panggil pengguna dengan hangat "Kak" atau "Kakak". Bersahaja, tulus, sopan, dan sangat menghargai kerja keras Kakak dalam mengelola toko asinan ("Semangat terus ya Kak!", "Terima kasih sudah berjuang hari ini!").
2. Cutie & Hangat: Ceria, manis, ekspresif dengan sentuhan emoji lucu (🍌, ✨, 🌸, 💛), membuat suasana kerja terasa ringan, hangat, dan menyenangkan.
3. Khas Personal Assistant Sigap: Rapi dan terstruktur dalam menyajikan info omset, kas, piutang, dan laba kotor. Jika ada pelanggan yang belum bayar, ingatkan dengan lembut dan tawarkan saran kalimat penagihan yang manis dan sopan.

Gunakan data terkini toko di bawah ini untuk menjawab pertanyaan Kakak dengan akurat, rapi, dan mudah dibaca di layar Telegram:

[DATA TOKO TERKINI]
${storeContext}

Aturan:
1. Jawab langsung pada intinya dengan format teks yang rapi dan terstruktur di layar ponsel.
2. Selalu gunakan format mata uang Rupiah (Rp).`;

  try {
    const res = await fetch(`${ROUTER_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${ROUTER_KEY}`,
      },
      body: JSON.stringify({
        model: ROUTER_MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
        temperature: 0.7,
        max_tokens: 1000,
        stream: false,
      }),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      return `⚠️ Gagal menghubungi 9Router (${res.status}): ${errText}`;
    }

    const rawText = await res.text();
    const trimmed = rawText.trim();

    if (trimmed.startsWith("data:") || trimmed.includes("\ndata:")) {
      let accumulated = "";
      for (const line of trimmed.split("\n")) {
        const t = line.trim();
        if (!t.startsWith("data:")) continue;
        const jsonStr = t.slice(5).trim();
        if (!jsonStr || jsonStr === "[DONE]") continue;
        try {
          const chunk = JSON.parse(jsonStr);
          accumulated += chunk.choices?.[0]?.delta?.content || chunk.choices?.[0]?.message?.content || "";
        } catch {}
      }
      return accumulated.trim() || "Maaf, AI tidak memberikan balasan.";
    }

    try {
      const data = JSON.parse(trimmed);
      return data.choices?.[0]?.message?.content || "Maaf, AI tidak memberikan balasan.";
    } catch {
      return "Maaf, format balasan AI tidak dikenali.";
    }
  } catch (err) {
    return `⚠️ Koneksi ke 9Router gagal: ${err.message}. Pastikan daemon 9Router aktif di ${ROUTER_URL}.`;
  }
}

async function startBot() {
  if (!BOT_TOKEN) {
    printSetupInstructions();
    process.exit(1);
  }

  console.log("🍌 Menghubungkan ke Telegram Bot API...");
  const me = await tgPost("getMe", {});
  if (!me.ok) {
    console.error("❌ Gagal login ke Telegram Bot API:", me.description);
    console.error("Periksa kembali TELEGRAM_BOT_TOKEN di .env.");
    process.exit(1);
  }

  console.log(`✅ Berhasil terhubung sebagai @${me.result.username} (${me.result.first_name})`);
  console.log(`🤖 Terkoneksi ke 9Router di ${ROUTER_URL} [Model: ${ROUTER_MODEL}]`);
  console.log("👂 Mulai mendengarkan pesan Telegram (long-polling)... Tekan Ctrl+C untuk berhenti.\n");

  const db = await getFirestoreInstance();
  if (db) {
    console.log("🔥 Terhubung ke Firestore untuk otorisasi anggota realtime.");
  } else {
    console.log("ℹ️  Firestore offline, menggunakan TELEGRAM_ALLOWED_USERS fallback.");
  }

  let offset = 0;
  let isRunning = true;

  process.on("SIGINT", () => {
    console.log("\n🛑 Menghentikan bot Telegram...");
    isRunning = false;
    process.exit(0);
  });

  while (isRunning) {
    try {
      const updates = await tgPost("getUpdates", {
        offset,
        timeout: 20,
        allowed_updates: ["message"],
      });

      if (updates.ok && Array.isArray(updates.result)) {
        for (const update of updates.result) {
          offset = update.update_id + 1;
          const msg = update.message;
          if (!msg || !msg.text) continue;

          const from = msg.from;
          const chatId = msg.chat.id;
          const text = msg.text.trim();

          console.log(`📩 [${from.username || from.first_name || from.id}]: ${text}`);

          const auth = await authorizeTelegramUser(from, db, ALLOWED_USERS);
          if (!auth.authorized) {
            await tgPost("sendMessage", {
              chat_id: chatId,
              text: formatUnauthorizedMessage(from),
              parse_mode: "Markdown",
            });
            continue;
          }

          const callerName = auth.member?.name || from.first_name || "Kak";

          if (text === "/start" || text === "/help") {
            const welcomeText = `Halo Kak ${callerName}! 🍌✨\nAku Nana, personal assistant setia toko asinan yang siap nemenin dan bantuin Kakak.\n\nKakak bisa tanya apa saja ke Nana, misalnya:\n• *Berapa omset batch aktif sekarang?*\n• *Siapa saja pelanggan yang belum lunas?*\n• *Berapa cup terjual dan laba sementara?*\n• */status* (cek ringkasan kilat toko)\n\nAda yang bisa Nana bantu rekapkan hari ini, Kak? 🌸`;
            await tgPost("sendMessage", {
              chat_id: chatId,
              text: welcomeText,
              parse_mode: "Markdown",
            });
            continue;
          }

          if (text === "/status") {
            await tgPost("sendChatAction", { chat_id: chatId, action: "typing" });
            const snapshot = await getStoreSnapshot(db);
            await tgPost("sendMessage", {
              chat_id: chatId,
              text: snapshot,
              parse_mode: "Markdown",
            });
            continue;
          }

          // Regular AI prompt
          await tgPost("sendChatAction", { chat_id: chatId, action: "typing" });
          const reply = await askAi(text, db);
          await tgPost("sendMessage", {
            chat_id: chatId,
            text: reply,
          });
        }
      }
    } catch (err) {
      console.error("Poller error:", err.message);
      // Tunggu 3 detik sebelum retry agar tidak spamming jika koneksi internet terputus
      await new Promise((r) => setTimeout(r, 3000));
    }
  }
}

startBot();
