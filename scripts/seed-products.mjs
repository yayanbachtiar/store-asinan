// Seed master produk awal SAJA (bukan user/order demo).
// Idempoten: aman dijalankan berulang kali.
// Pakai: DATABASE_URL=postgres://... node scripts/seed-products.mjs
import pg from "pg";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL belum diisi.");
  process.exit(1);
}
const client = new pg.Client({ connectionString: url });
await client.connect();
const products = [
  ["Cup Kecil", 10000],
  ["Cup Besar", 20000],
];
for (const [name, price] of products) {
  await client.query(
    `INSERT INTO products (name, price) VALUES ($1, $2)
     ON CONFLICT (name) DO NOTHING`,
    [name, price],
  );
  console.log(`produk: ${name} Rp${price}`);
}
await client.end();
