import type { Customer } from "../types";
import { createDoc, deleteDoc, getDoc, listDocs, updateDoc } from "./base";

const COLLECTION = "customers";
type CustomerData = Omit<Customer, "id" | "createdAt">;

export async function listCustomers(): Promise<Customer[]> {
  return (await listDocs<CustomerData>(COLLECTION)).sort((a, b) =>
    a.name.localeCompare(b.name, "id"),
  );
}

export async function getCustomer(id: string): Promise<Customer | null> {
  return getDoc<CustomerData>(COLLECTION, id);
}

export async function createCustomer(data: CustomerData): Promise<Customer> {
  return createDoc<CustomerData>(COLLECTION, data);
}

export async function updateCustomer(
  id: string,
  data: Partial<CustomerData>,
): Promise<Customer | null> {
  return updateDoc<CustomerData>(COLLECTION, id, data);
}

export async function deleteCustomer(id: string): Promise<void> {
  return deleteDoc(COLLECTION, id);
}
