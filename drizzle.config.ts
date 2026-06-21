import { defineConfig } from "drizzle-kit";

/**
 * Drizzle dipakai untuk DEFINISI skema + GENERATE migrasi SQL.
 * `drizzle-kit generate` tidak butuh koneksi DB. `push`/`migrate`/`studio` butuh DATABASE_URL
 * (diisi setelah project Supabase dibuat via kaki-tangan).
 */
export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./src/db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "postgresql://placeholder",
  },
  verbose: true,
  strict: true,
});
