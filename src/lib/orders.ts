import { getProduct } from "./repo/products";
import type { OrderItem } from "./types";

/** Ambil snapshot nama + harga produk saat ini untuk item order baru. */
export async function snapshotItems(
  items: { productId: string; qty: number }[],
): Promise<OrderItem[]> {
  const snapshots: OrderItem[] = [];
  for (const item of items) {
    const product = await getProduct(item.productId);
    if (!product) throw new Error(`Produk ${item.productId} tidak ditemukan`);
    snapshots.push({
      productId: product.id,
      productNameSnapshot: product.name,
      priceSnapshot: product.price,
      qty: item.qty,
    });
  }
  return snapshots;
}
