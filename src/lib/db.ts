// Bulletproof env loader: read .env directly with fs and force the Neon URL
// into process.env BEFORE PrismaClient is constructed. The sandbox shell
// sometimes has a SQLite DATABASE_URL that overrides Next.js's .env loading,
// so we can't rely on Next or dotenv alone.
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

try {
  const envPath = resolve(process.cwd(), ".env");
  const raw = readFileSync(envPath, "utf8");
  for (const line of raw.split("\n")) {
    const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*"?(.*?)"?\s*$/i);
    if (m) {
      const [, key, val] = m;
      // Force override — the .env file is the source of truth for this app.
      process.env[key] = val;
    }
  }
} catch {
  // .env may not exist in some environments; fall through to process.env.
}

import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
