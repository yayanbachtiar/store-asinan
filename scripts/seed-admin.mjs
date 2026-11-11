// Insert ANGGOTA PERTAMA (admin awal / bendahara) ke collection `members`.
// Dibutuhkan sekali saja saat bootstrap: belum ada yang bisa login sebelum
// dokumen ini ada (halaman Pengaturan berada di balik login).
// Idempoten: email yang sudah terdaftar dilewati, tidak dibuat ganda.
//
// Email diambil dari argumen/env — SENGAJA tidak ditulis di kode karena
// repo ini publik.
//
// Cara pakai (lokal, dari folder repo):
//   gcloud auth application-default login        # sekali, akun pemilik project
//   FIREBASE_PROJECT_ID=<project-id> FIRESTORE_DATABASE_ID=<nama-database> \
//   ADMIN_EMAIL=email@gmail.com ADMIN_NAME="Nama" \
//   pnpm seed:admin
//
// Opsional: ADMIN_ROLE (default "bendahara" — admin awal memegang peran
// bendahara agar fungsi kas langsung jalan; anggota lain, termasuk bendahara
// sebenarnya bila berbeda, ditambahkan dari halaman Pengaturan setelah login,
// lalu peran dokumen ini bisa diubah dari sana juga).
import { applicationDefault, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const projectId =
  process.env.FIREBASE_PROJECT_ID ?? process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
if (!projectId && !process.env.FIRESTORE_EMULATOR_HOST) {
  console.error("FIREBASE_PROJECT_ID belum diisi.");
  process.exit(1);
}

const email = (process.env.ADMIN_EMAIL ?? "").trim().toLowerCase();
if (!email || !email.includes("@")) {
  console.error("ADMIN_EMAIL belum diisi / tidak valid. Contoh: ADMIN_EMAIL=email@gmail.com pnpm seed:admin");
  process.exit(1);
}
const name = process.env.ADMIN_NAME ?? "Admin";
const role = process.env.ADMIN_ROLE ?? "bendahara";
if (role !== "bendahara" && role !== "anggota") {
  console.error('ADMIN_ROLE harus "bendahara" atau "anggota".');
  process.exit(1);
}

initializeApp(
  process.env.FIRESTORE_EMULATOR_HOST
    ? { projectId: projectId ?? "demo-kas-asinan" }
    : { projectId, credential: applicationDefault() },
);
const databaseId = process.env.FIRESTORE_DATABASE_ID;
const db = databaseId && databaseId !== "(default)" ? getFirestore(databaseId) : getFirestore();

const existing = await db.collection("members").where("email", "==", email).limit(1).get();
if (!existing.empty) {
  console.log(`anggota sudah ada, dilewati: ${email} (doc ${existing.docs[0].id})`);
  process.exit(0);
}

const ref = await db.collection("members").add({
  name,
  email,
  telegramId: null,
  role,
  isActive: true,
  createdAt: new Date().toISOString(),
});
console.log(`anggota pertama dibuat: ${name} <${email}> role=${role} doc=${ref.id}`);
console.log("Sekarang login ke aplikasi dengan akun Google email tsb, lalu tambahkan anggota lain di halaman Pengaturan.");
process.exit(0);
