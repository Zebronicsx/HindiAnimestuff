import { db } from "@/db";
import { anime, watchlist } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { rowToAnime } from "@/lib/catalog";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const rows = await db
      .select({ addedAt: watchlist.addedAt, a: anime })
      .from(watchlist)
      .innerJoin(anime, eq(anime.id, watchlist.animeId))
      .orderBy(desc(watchlist.addedAt));
    return Response.json({
      ids: rows.map((r) => r.a.id),
      items: rows.map((r) => rowToAnime(r.a)),
    });
  } catch {
    return Response.json({ ids: [], items: [] });
  }
}

export async function POST(req: Request) {
  try {
    const { animeId } = (await req.json()) as { animeId?: string };
    if (!animeId) return Response.json({ error: "animeId required" }, { status: 400 });
    await db.insert(watchlist).values({ animeId }).onConflictDoNothing();
    return Response.json({ ok: true, added: true });
  } catch {
    return Response.json({ error: "Failed to save" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const animeId = new URL(req.url).searchParams.get("animeId");
    if (!animeId) return Response.json({ error: "animeId required" }, { status: 400 });
    await db.delete(watchlist).where(eq(watchlist.animeId, animeId));
    return Response.json({ ok: true, added: false });
  } catch {
    return Response.json({ error: "Failed to remove" }, { status: 500 });
  }
}