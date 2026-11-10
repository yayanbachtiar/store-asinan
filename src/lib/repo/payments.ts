import type { Payment } from "../types";
import { createDoc, deleteDoc, findDocs, getDoc, listDocs } from "./base";

const COLLECTION = "payments";
type PaymentData = Omit<Payment, "id" | "createdAt">;

const byCreatedAt = (a: Payment, b: Payment) => a.createdAt.localeCompare(b.createdAt);

export async function listPayments(): Promise<Payment[]> {
  return (await listDocs<PaymentData>(COLLECTION)).sort(byCreatedAt);
}

/** Praktis berkat denormalisasi batchId di dokumen payments. */
export async function listPaymentsByBatch(batchId: string): Promise<Payment[]> {
  return (await findDocs<PaymentData>(COLLECTION, "batchId", batchId)).sort(byCreatedAt);
}

export async function listPaymentsByOrder(orderId: string): Promise<Payment[]> {
  return (await findDocs<PaymentData>(COLLECTION, "orderId", orderId)).sort(byCreatedAt);
}

export async function getPayment(id: string): Promise<Payment | null> {
  return getDoc<PaymentData>(COLLECTION, id);
}

export async function createPayment(data: PaymentData): Promise<Payment> {
  return createDoc<PaymentData>(COLLECTION, data);
}

export async function deletePayment(id: string): Promise<void> {
  return deleteDoc(COLLECTION, id);
}
