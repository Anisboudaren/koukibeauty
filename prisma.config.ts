import "dotenv/config";
import { defineConfig } from "prisma/config";

/**
 * Prefer DIRECT_URL (non-pooled Neon) for CLI migrate/push.
 * Fall back to DATABASE_URL so Vercel builds work when only that is set.
 * Last resort placeholder lets `prisma generate` run without any DB env
 * (client generation does not open a connection).
 */
function datasourceUrl(): string {
  return (
    process.env.DIRECT_URL ||
    process.env.DATABASE_URL ||
    "postgresql://build:build@127.0.0.1:5432/build"
  );
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "npx tsx prisma/seed.ts",
  },
  datasource: {
    url: datasourceUrl(),
  },
});
