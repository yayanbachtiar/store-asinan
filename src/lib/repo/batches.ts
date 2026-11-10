import type { Batch } from "../types";
import { createDoc, getDoc, listDocs, updateDoc } from "./base";

const COLLECTION = "batches";
type BatchData = Omit<Batch, "id" | "createdAt">;

export async function listBatches(): Promise<Batch[]> {
  // Terbaru dulu: tanggal (YYYY-MM-DD bisa dibandingkan sebagai string),
  // lalu waktu dibuat.
  return (await listDocs<BatchData>(COLLECTION)).sort(
    (a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt),
  );
}

export async function getBatch(id: string): Promise<Batch | null> {
  return getDoc<BatchData>(COLLECTION, id);
}

export async function createBatch(data: BatchData): Promise<Batch> {
  return createDoc<BatchData>(COLLECTION, data);
}

export async function updateBatch(id: string, data: Partial<BatchData>): Promise<Batch | null> {
  return updateDoc<BatchData>(COLLECTION, id, data);
}
