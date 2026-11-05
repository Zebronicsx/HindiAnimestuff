import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import * as schema from "./schema";

// On Cloudflare Workers / Pages there is no native PostgreSQL driver.
// We make the DB completely optional. When DATABASE_URL is missing (or
// connection fails), all data helpers fall back to the bundled catalog.json.

type Db = NodePgDatabase<typeof schema>;

let _db: Db | null = null;
let _initAttempted = false;

function createDb(): Db | null {
  if (_initAttempted) return _db;
  _initAttempted = true;

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.warn("[db] DATABASE_URL not set — using static catalog fallback");
    return null;
  }

  try {
    // Dynamic require so the Edge/Worker build does not pull in `pg`
    // unless the env var is actually present at runtime.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Pool } = require("pg") as typeof import("pg");
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { drizzle } = require("drizzle-orm/node-postgres") as typeof import("drizzle-orm/node-postgres");

    const globalForDb = globalThis as typeof globalThis & {
      __animesfreakPool?: InstanceType<typeof Pool>;
    };

    const pool =
      globalForDb.__animesfreakPool ??
      new Pool({
        connectionString: databaseUrl,
        max: 5,
        idleTimeoutMillis: 10_000,
        connectionTimeoutMillis: 5_000,
      });

    if (process.env.NODE_ENV !== "production") {
      globalForDb.__animesfreakPool = pool;
    }

    _db = drizzle(pool, { schema }) as Db;
    return _db;
  } catch (err) {
    console.warn("[db] Failed to initialise PostgreSQL — using static catalog", err);
    return null;
  }
}

/** Always-safe accessor. Returns null when no DB is available. */
export function getDb(): Db | null {
  return createDb();
}

/**
 * Backward-compatible export used by the rest of the codebase.
 * Throws only when code actually tries to query without a DB.
 * All public data helpers already wrap calls in try/catch.
 */
export const db = new Proxy({} as Db, {
  get(_target, prop) {
    const real = createDb();
    if (!real) {
      // Return a function that always rejects so callers hit their catch blocks
      if (typeof prop === "string") {
        return () => Promise.reject(new Error("Database not available"));
      }
      return undefined;
    }
    // @ts-expect-error – proxy
    return real[prop];
  },
});
