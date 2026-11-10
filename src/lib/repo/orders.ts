import type { Order } from "../types";
import { createDoc, deleteDoc, findDocs, getDoc, listDocs, updateDoc } from "./base";

const COLLECTION = "orders";
type OrderData = Omit<Order, "id" | "createdAt">;

const byCreatedAt = (a: Order, b: Order) => a.createdAt.localeCompare(b.createdAt);

export async function listOrders(): Promise<Order[]> {
  return (await listDocs<OrderData>(COLLECTION)).sort(byCreatedAt);
}

export async function listOrdersByBatch(batchId: string): Promise<Order[]> {
  return (await findDocs<OrderData>(COLLECTION, "batchId", batchId)).sort(byCreatedAt);
}

export async function listOrdersByCustomer(customerId: string): Promise<Order[]> {
  return findDocs<OrderData>(COLLECTION, "customerId", customerId);
}

export async function listOrdersByPaymentStatus(status: Order["paymentStatus"]): Promise<Order[]> {
  return (await findDocs<OrderData>(COLLECTION, "paymentStatus", status)).sort(byCreatedAt);
}

export async function getOrder(id: string): Promise<Order | null> {
  return getDoc<OrderData>(COLLECTION, id);
}

export async function createOrder(data: OrderData): Promise<Order> {
  return createDoc<OrderData>(COLLECTION, data);
}

export async function updateOrder(id: string, data: Partial<OrderData>): Promise<Order | null> {
  return updateDoc<OrderData>(COLLECTION, id, data);
}

export async function deleteOrder(id: string): Promise<void> {
  return deleteDoc(COLLECTION, id);
}
