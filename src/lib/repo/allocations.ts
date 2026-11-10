import type { ProfitAllocation } from "../types";
import { createDoc, deleteDoc, findDocs, getDoc } from "./base";

const COLLECTION = "profit_allocations";
type AllocationData = Omit<ProfitAllocation, "id" | "createdAt">;

export async function listAllocationsByBatch(batchId: string): Promise<ProfitAllocation[]> {
  return (await findDocs<AllocationData>(COLLECTION, "batchId", batchId)).sort((a, b) =>
    a.createdAt.localeCompare(b.createdAt),
  );
}

export async function getAllocation(id: string): Promise<ProfitAllocation | null> {
  return getDoc<AllocationData>(COLLECTION, id);
}

export async function createAllocation(data: AllocationData): Promise<ProfitAllocation> {
  return createDoc<AllocationData>(COLLECTION, data);
}

export async function deleteAllocation(id: string): Promise<void> {
  return deleteDoc(COLLECTION, id);
}
