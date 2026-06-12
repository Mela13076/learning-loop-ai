// Single shared Prisma client for the whole app (CLAUDE.md: "Never instantiate
// PrismaClient outside of lib/db.ts").
//
// Why a global singleton? In development, Next.js hot-reloads modules on every
// edit. Without this guard, each reload would create a brand-new PrismaClient
// (and a new database connection pool), eventually exhausting the database's
// connection limit. We stash one instance on `globalThis` and reuse it across
// reloads. In production the module is only evaluated once, so the guard is a
// no-op there.
//
// Prisma 7 uses a driver adapter instead of a bundled query engine. We use the
// node-postgres adapter (PrismaPg) pointed at the pooled DATABASE_URL. The
// generated client lives in src/generated/prisma (see prisma/schema.prisma).
import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

function createPrismaClient() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  return new PrismaClient({ adapter });
}

// Reuse the same client across hot reloads in development.
const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof createPrismaClient> | undefined;
};

export const db = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}
