import type { Expense } from "../types";
import { createDoc, deleteDoc, findDocs, getDoc, updateDoc } from "./base";

const COLLECTION = "expenses";
type ExpenseData = Omit<Expense, "id" | "createdAt">;

const byCreatedAt = (a: Expense, b: Expense) => a.createdAt.localeCompare(b.createdAt);

export async function listExpensesByBatch(batchId: string): Promise<Expense[]> {
  return (await findDocs<ExpenseData>(COLLECTION, "batchId", batchId)).sort(byCreatedAt);
}

export async function getExpense(id: string): Promise<Expense | null> {
  return getDoc<ExpenseData>(COLLECTION, id);
}

export async function createExpense(data: ExpenseData): Promise<Expense> {
  return createDoc<ExpenseData>(COLLECTION, data);
}

export async function updateExpense(
  id: string,
  data: Partial<ExpenseData>,
): Promise<Expense | null> {
  return updateDoc<ExpenseData>(COLLECTION, id, data);
}

export async function deleteExpense(id: string): Promise<void> {
  return deleteDoc(COLLECTION, id);
}
