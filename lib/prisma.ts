import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { Pool } from "@neondatabase/serverless";

// Standard Next.js dev-mode singleton: hot reload would otherwise create a
// new PrismaClient (and a new connection pool) on every edit.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

// Neon's HTTP-based driver adapter instead of a raw TCP pool — avoids
// exhausting Postgres connections when Vercel fans out serverless functions.
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaNeon(pool);

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
