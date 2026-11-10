import type { Advance } from "../types";
import { createDoc, deleteDoc, findDocs, getDoc, listDocs, updateDoc } from "./base";

const COLLECTION = "advances";
type AdvanceData = Omit<Advance, "id" | "createdAt">;

const byCreatedAt = (a: Advance, b: Advance) => a.createdAt.localeCompare(b.createdAt);

export async function listAdvances(): Promise<Advance[]> {
  return (await listDocs<AdvanceData>(COLLECTION)).sort(byCreatedAt);
}

export async function listAdvancesByBatch(batchId: string): Promise<Advance[]> {
  return (await findDocs<AdvanceData>(COLLECTION, "batchId", batchId)).sort(byCreatedAt);
}

export async function getAdvance(id: string): Promise<Advance | null> {
  return getDoc<AdvanceData>(COLLECTION, id);
}

export async function createAdvance(data: AdvanceData): Promise<Advance> {
  return createDoc<AdvanceData>(COLLECTION, data);
}

export async function updateAdvance(
  id: string,
  data: Partial<AdvanceData>,
): Promise<Advance | null> {
  return updateDoc<AdvanceData>(COLLECTION, id, data);
}

export async function deleteAdvance(id: string): Promise<void> {
  return deleteDoc(COLLECTION, id);
}
