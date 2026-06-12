// Prisma 7 configuration.
// In Prisma 7 the datasource URL no longer lives in schema.prisma — it is
// resolved here. This project keeps secrets in `.env.local` (not `.env`), so we
// load that file explicitly before reading the connection strings.
import { config as loadEnv } from "dotenv";
loadEnv({ path: ".env.local" });

import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // Migrations / introspection (the CLI) use a DIRECT, unpooled connection.
    // Neon's pooled endpoint (PgBouncer) can't run migrations, so prefer
    // DIRECT_URL and fall back to DATABASE_URL for plain Postgres setups.
    // The app's runtime client uses the pooled DATABASE_URL — see src/lib/db.ts.
    url: process.env.DIRECT_URL ?? process.env.DATABASE_URL,
  },
});
