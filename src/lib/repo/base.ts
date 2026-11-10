import { getDb } from "../db";

/**
 * Helper generik di atas Firestore untuk lapisan repository.
 *
 * Keputusan desain (skala aplikasi ini: 5 pengguna, ±30 order/batch):
 * - Hanya operasi dasar yang dipakai: add / doc.get / doc.update /
 *   doc.delete / collection.get / where("=="). Pengurutan & agregasi
 *   dilakukan di memori server (oleh src/lib/data.ts + src/lib/finance.ts),
 *   BUKAN query agregat — volume dokumen per collection kecil, jadi membaca
 *   semua dokumen per batch lalu menghitung di kode murni itu sederhana,
 *   deterministik, dan mudah diuji.
 * - Nilai `undefined` dibuang sebelum tulis (Firestore menolak undefined).
 * - createdAt diisi otomatis sebagai string ISO saat dokumen dibuat.
 */

export type DocData = Record<string, unknown>;

function clean<T extends DocData>(data: T): DocData {
  const out: DocData = {};
  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) out[key] = value;
  }
  return out;
}

export async function createDoc<T extends DocData>(
  collection: string,
  data: T,
): Promise<T & { id: string; createdAt: string }> {
  const payload = { ...clean(data), createdAt: new Date().toISOString() };
  const ref = await getDb().collection(collection).add(payload);
  return { ...payload, id: ref.id } as unknown as T & { id: string; createdAt: string };
}

export async function getDoc<T extends DocData>(
  collection: string,
  id: string,
): Promise<(T & { id: string; createdAt: string }) | null> {
  const snap = await getDb().collection(collection).doc(id).get();
  if (!snap.exists) return null;
  return { ...(snap.data() as T), id: snap.id } as T & { id: string; createdAt: string };
}

export async function updateDoc<T extends DocData>(
  collection: string,
  id: string,
  data: Partial<T>,
): Promise<(T & { id: string; createdAt: string }) | null> {
  const ref = getDb().collection(collection).doc(id);
  const snap = await ref.get();
  if (!snap.exists) return null;
  await ref.update(clean(data));
  const after = await ref.get();
  return { ...(after.data() as T), id: after.id } as T & { id: string; createdAt: string };
}

export async function deleteDoc(collection: string, id: string): Promise<void> {
  await getDb().collection(collection).doc(id).delete();
}

export async function listDocs<T extends DocData>(
  collection: string,
): Promise<(T & { id: string; createdAt: string })[]> {
  const snap = await getDb().collection(collection).get();
  return snap.docs.map((d) => ({ ...(d.data() as T), id: d.id }) as T & {
    id: string;
    createdAt: string;
  });
}

export async function findDocs<T extends DocData>(
  collection: string,
  field: string,
  value: string,
): Promise<(T & { id: string; createdAt: string })[]> {
  const snap = await getDb().collection(collection).where(field, "==", value).get();
  return snap.docs.map((d) => ({ ...(d.data() as T), id: d.id }) as T & {
    id: string;
    createdAt: string;
  });
}

export async function findOne<T extends DocData>(
  collection: string,
  field: string,
  value: string,
): Promise<(T & { id: string; createdAt: string }) | null> {
  const rows = await findDocs<T>(collection, field, value);
  return rows[0] ?? null;
}
