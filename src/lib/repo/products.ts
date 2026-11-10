import type { Product } from "../types";
import { createDoc, findOne, getDoc, listDocs, updateDoc } from "./base";

const COLLECTION = "products";
type ProductData = Omit<Product, "id" | "createdAt">;

export async function listProducts(): Promise<Product[]> {
  return (await listDocs<ProductData>(COLLECTION)).sort((a, b) =>
    a.name.localeCompare(b.name, "id"),
  );
}

export async function getProduct(id: string): Promise<Product | null> {
  return getDoc<ProductData>(COLLECTION, id);
}

export async function findProductByName(name: string): Promise<Product | null> {
  return findOne<ProductData>(COLLECTION, "name", name);
}

export async function createProduct(data: ProductData): Promise<Product> {
  return createDoc<ProductData>(COLLECTION, data);
}

export async function updateProduct(
  id: string,
  data: Partial<ProductData>,
): Promise<Product | null> {
  return updateDoc<ProductData>(COLLECTION, id, data);
}

/** Produk awal usaha. Idempoten: produk yang sudah ada (berdasarkan nama) dilewati. */
export const DEFAULT_PRODUCTS: { name: string; price: number }[] = [
  { name: "Cup Kecil", price: 10_000 },
  { name: "Cup Besar", price: 20_000 },
];

export async function seedProducts(): Promise<{ name: string; created: boolean }[]> {
  const results: { name: string; created: boolean }[] = [];
  for (const product of DEFAULT_PRODUCTS) {
    const existing = await findProductByName(product.name);
    if (existing) {
      results.push({ name: product.name, created: false });
    } else {
      await createProduct({ ...product, isActive: true });
      results.push({ name: product.name, created: true });
    }
  }
  return results;
}
