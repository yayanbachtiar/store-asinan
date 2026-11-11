// Seed master produk awal SAJA (bukan user/order demo) ke Firestore.
// Idempoten: produk yang sudah ada (berdasarkan nama) dilewati.
//
// Pakai salah satu kredensial Admin SDK:
//   - Lokal + emulator:  FIRESTORE_EMULATOR_HOST=localhost:8080 FIREBASE_PROJECT_ID=demo-x pnpm seed:products
//   - Lokal + asli:      GOOGLE_APPLICATION_CREDENTIALS=/path/kunci.json FIREBASE_PROJECT_ID=<id> pnpm seed:products
//   - Cloud Run / GCP:   kredensial bawaan runtime (ADC), cukup FIREBASE_PROJECT_ID.
import { applicationDefault, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const projectId =
  process.env.FIREBASE_PROJECT_ID ?? process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
if (!projectId && !process.env.FIRESTORE_EMULATOR_HOST) {
  console.error("FIREBASE_PROJECT_ID belum diisi.");
  process.exit(1);
}

initializeApp(
  process.env.FIRESTORE_EMULATOR_HOST
    ? { projectId: projectId ?? "demo-kas-asinan" }
    : { projectId, credential: applicationDefault() },
);
const databaseId = process.env.FIRESTORE_DATABASE_ID;
const db = databaseId && databaseId !== "(default)" ? getFirestore(databaseId) : getFirestore();

const products = [
  ["Cup Kecil", 10000],
  ["Cup Besar", 20000],
];
for (const [name, price] of products) {
  const existing = await db.collection("products").where("name", "==", name).limit(1).get();
  if (existing.empty) {
    await db.collection("products").add({
      name,
      price,
      isActive: true,
      createdAt: new Date().toISOString(),
    });
    console.log(`produk dibuat: ${name} Rp${price}`);
  } else {
    console.log(`produk sudah ada, dilewati: ${name}`);
  }
}
process.exit(0);
