import { db } from "@/db";
import { anime, episodes } from "@/db/schema";
import { asc, eq, sql } from "drizzle-orm";
import { buildEpisodes, fallbackAnime, rowToAnime } from "@/lib/catalog";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const rows = await db.select().from(anime).where(eq(anime.id, id)).limit(1);
    if (!rows[0]) return Response.json({ error: "Not found" }, { status: 404 });
    const a = rowToAnime(rows[0]);
    const eps = await db
      .select()
      .from(episodes)
      .where(eq(episodes.animeId, id))
      .orderBy(asc(episodes.num));
    const related = await db
      .select()
      .from(anime)
      .where(sql`${anime.id} <> ${id} and ${anime.genres} && ${a.genres}`)
      .orderBy(sql`${anime.score} desc`)
      .limit(12);
    return Response.json({
      anime: a,
      episodes: eps.length ? eps : buildEpisodes(a),
      related: related.map((r) => rowToAnime(r)),
    });
  } catch {
    const a = fallbackAnime(id);
    if (!a) return Response.json({ error: "Not found" }, { status: 404 });
    return Response.json({ anime: a, episodes: buildEpisodes(a), related: [] });
  }
}