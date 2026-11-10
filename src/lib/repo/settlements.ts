import type { Settlement } from "../types";
import { createDoc, deleteDoc, getDoc, listDocs, updateDoc } from "./base";

const COLLECTION = "settlements";
type SettlementData = Omit<Settlement, "id" | "createdAt">;

/**
 * Setoran TIDAK terikat batch (uang anggota lintas batch) — posisi kas
 * dihitung global agar tidak dobel antar-batch. Karena itu repository ini
 * hanya menyediakan daftar global.
 */
export async function listSettlements(): Promise<Settlement[]> {
  return (await listDocs<SettlementData>(COLLECTION)).sort((a, b) =>
    a.createdAt.localeCompare(b.createdAt),
  );
}

export async function getSettlement(id: string): Promise<Settlement | null> {
  return getDoc<SettlementData>(COLLECTION, id);
}

export async function createSettlement(data: SettlementData): Promise<Settlement> {
  return createDoc<SettlementData>(COLLECTION, data);
}

export async function updateSettlement(
  id: string,
  data: Partial<SettlementData>,
): Promise<Settlement | null> {
  return updateDoc<SettlementData>(COLLECTION, id, data);
}

export async function deleteSettlement(id: string): Promise<void> {
  return deleteDoc(COLLECTION, id);
}
