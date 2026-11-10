import { inArray } from "drizzle-orm";
import { db } from "@/db";
import { products } from "@/db/schema";

/** Ambil snapshot nama + harga produk saat ini untuk item order. */
export async function snapshotItems(items: { productId: number; qty: number }[]) {
  const rows = await db
    .select()
    .from(products)
    .where(inArray(products.id, items.map((i) => i.productId)));
  const byId = new Map(rows.map((p) => [p.id, p]));
  return items.map((item) => {
    const product = byId.get(item.productId);
    if (!product) throw new Error(`Produk ${item.productId} tidak ditemukan`);
    return {
      productId: product.id,
      productNameSnapshot: product.name,
      priceSnapshot: product.price,
      qty: item.qty,
    };
  });
}
