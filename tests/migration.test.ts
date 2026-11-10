import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { describe, expect, it } from "vitest";

/**
 * Bukti migrasi jalan — dijalankan di PGlite (PostgreSQL WASM di proses
 * lokal), BUKAN PostgreSQL server asli. Bukti final tetap migrasi ke
 * Postgres beneran saat deploy pertama.
 */
describe("migrasi drizzle", () => {
  it("semua file SQL migrasi terapkan bersih & tabel inti terbentuk", { timeout: 60_000 }, async () => {
    const dir = path.resolve(__dirname, "../drizzle");
    const files = (await readdir(dir)).filter((f) => f.endsWith(".sql")).sort();
    expect(files.length).toBeGreaterThan(0);

    const pg = new PGlite();
    for (const file of files) {
      const sql = await readFile(path.join(dir, file), "utf8");
      for (const statement of sql.split("--> statement-breakpoint")) {
        const trimmed = statement.trim();
        if (trimmed) await pg.exec(trimmed);
      }
    }
    const tables = await pg.query<{ tablename: string }>(
      `SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename`,
    );
    const names = tables.rows.map((r) => r.tablename);
    for (const expected of [
      "members", "customers", "products", "batches", "expenses", "orders",
      "order_items", "payments", "settlements", "advances",
      "profit_allocations", "ai_usage", "audit_log",
    ]) {
      expect(names).toContain(expected);
    }

    // Uji tulis dasar: produk awal bisa dimasukkan.
    await pg.query(`INSERT INTO products (name, price) VALUES ('Cup Kecil', 10000), ('Cup Besar', 20000)`);
    const count = await pg.query<{ count: string }>(`SELECT COUNT(*)::text AS count FROM products`);
    expect(count.rows[0].count).toBe("2");
    await pg.close();
  });
});
