import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

/**
 * Pool dibuat malas (lazy): pg.Pool tidak membuka koneksi sampai query
 * pertama, jadi `next build` aman berjalan tanpa DATABASE_URL / tanpa DB.
 * Halaman yang membaca DB wajib `export const dynamic = "force-dynamic"`
 * dan membungkus query dengan penanganan error (keadaan kosong).
 */
const globalForDb = globalThis as typeof globalThis & { __asinanPool?: Pool };

export const pool =
  globalForDb.__asinanPool ??
  new Pool({ connectionString: process.env.DATABASE_URL, max: 5 });
globalForDb.__asinanPool = pool;

export const db = drizzle(pool, { schema });
export * as schema from "./schema";
