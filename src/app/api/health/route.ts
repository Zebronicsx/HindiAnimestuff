import { getDb } from "@/db";
import { sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  const database = getDb();
  if (!database) {
    return Response.json({ ok: true, mode: "static-catalog" });
  }
  try {
    await database.execute(sql`select 1`);
    return Response.json({ ok: true, mode: "postgres" });
  } catch {
    return Response.json({ ok: true, mode: "static-catalog-fallback" });
  }
}
