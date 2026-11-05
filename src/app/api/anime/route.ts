import { db } from "@/db";
import { anime } from "@/db/schema";
import { and, asc, desc, eq, ilike, isNotNull, or, sql } from "drizzle-orm";
import { CATALOG, rowToAnime } from "@/lib/catalog";
import type { Anime } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = (url.searchParams.get("q") ?? "").trim();
  const genre = url.searchParams.get("genre") ?? "";
  const type = url.searchParams.get("type") ?? "";
  const sort = url.searchParams.get("sort") ?? "popular";
  const filter = url.searchParams.get("filter") ?? "";
  const limit = Math.min(Number(url.searchParams.get("limit") ?? 100), 100);

  try {
    const conds = [];
    if (q) conds.push(or(ilike(anime.title, `%${q}%`), ilike(anime.romaji, `%${q}%`)));
    if (genre) conds.push(sql`${genre} = ANY(${anime.genres})`);
    if (type === "movie" || type === "series") conds.push(eq(anime.type, type));
    if (filter === "featured") conds.push(isNotNull(anime.featuredRank));
    if (filter === "trending") conds.push(isNotNull(anime.trendingRank));
    if (filter === "new") conds.push(eq(anime.isNew, true));

    const order =
      filter === "featured"
        ? asc(anime.featuredRank)
        : filter === "trending" || sort === "trending"
          ? sql`${anime.trendingRank} asc nulls last, ${anime.score} desc`
          : sort === "rating"
            ? desc(anime.score)
            : sort === "newest"
              ? desc(anime.createdAt)
              : sort === "az"
                ? asc(anime.title)
                : desc(anime.score);

    const rows = await db
      .select()
      .from(anime)
      .where(conds.length ? and(...conds) : undefined)
      .orderBy(order)
      .limit(limit);

    return Response.json({ items: rows.map((r) => rowToAnime(r)) });
  } catch {
    // graceful fallback to bundled catalog if DB is unavailable
    let items: Anime[] = [...CATALOG];
    if (q) {
      const qq = q.toLowerCase();
      items = items.filter(
        (a) => a.title.toLowerCase().includes(qq) || a.romaji.toLowerCase().includes(qq)
      );
    }
    if (genre) items = items.filter((a) => a.genres.includes(genre));
    if (type) items = items.filter((a) => a.type === type);
    if (filter === "featured")
      items = items.filter((a) => a.featuredRank).sort((a, b) => a.featuredRank! - b.featuredRank!);
    else if (filter === "trending")
      items = items.filter((a) => a.trendingRank).sort((a, b) => a.trendingRank! - b.trendingRank!);
    else if (filter === "new") items = items.filter((a) => a.isNew);
    else if (sort === "newest")
      items.sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));
    else if (sort === "az") items.sort((a, b) => a.title.localeCompare(b.title));
    else if (sort === "trending")
      items.sort((a, b) => (a.trendingRank ?? 99) - (b.trendingRank ?? 99));
    else items.sort((a, b) => b.score - a.score);
    return Response.json({ items: items.slice(0, limit) });
  }
}