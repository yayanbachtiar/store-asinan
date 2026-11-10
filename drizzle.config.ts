import { defineConfig } from "drizzle-kit";

// URL hanya dipakai saat menjalankan migrasi secara manual (runtime),
// TIDAK pernah dibakar ke image saat build.
export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "postgres://asinan:asinan@localhost:5432/asinan",
  },
});
