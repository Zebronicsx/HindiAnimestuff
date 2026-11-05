import { db } from "@/db";
import { anime, episodes } from "@/db/schema";
import { asc, desc, eq, sql } from "drizzle-orm";
import { CATALOG, buildEpisodes, fallbackAnime, rowToAnime } from "./catalog";
import type { Anime, Episode } from "./types";

export async function getAll(): Promise<Anime[]> {
  try {
    const rows = await db.select().from(anime).orderBy(desc(anime.score));
    if (rows.length === 0) return [...CATALOG].sort((a, b) => b.score - a.score);
    return rows.map((r) => rowToAnime(r));
  } catch {
    return [...CATALOG].sort((a, b) => b.score - a.score);
  }
}

export async function getDetail(slug: string): Promise<{
  anime: Anime;
  episodes: Episode[];
  related: Anime[];
} | null> {
  try {
    const rows = await db.select().from(anime).where(eq(anime.id, slug)).limit(1);
    const a = rows[0] ? rowToAnime(rows[0]) : fallbackAnime(slug);
    if (!a) return null;
    let eps: Episode[] = [];
    try {
      const epRows = await db
        .select()
        .from(episodes)
        .where(eq(episodes.animeId, slug))
        .orderBy(asc(episodes.num));
      eps = epRows.map((e) => ({
        id: e.id,
        animeId: e.animeId,
        num: e.num,
        title: e.title,
        duration: e.duration,
        stream: e.stream,
        downloads: e.downloads,
      }));
    } catch {}
    if (eps.length === 0) eps = buildEpisodes(a);
    let related: Anime[] = [];
    try {
      const rel = await db
        .select()
        .from(anime)
        .where(sql`${anime.id} <> ${slug} and ${anime.genres} && ${a.genres}`)
        .orderBy(desc(anime.score))
        .limit(12);
      related = rel.map((r) => rowToAnime(r));
    } catch {
      related = CATALOG.filter(
        (x) => x.id !== slug && x.genres.some((g) => a.genres.includes(g))
      ).slice(0, 12);
    }
    return { anime: a, episodes: eps, related };
  } catch {
    const a = fallbackAnime(slug);
    if (!a) return null;
    return {
      anime: a,
      episodes: buildEpisodes(a),
      related: CATALOG.filter(
        (x) => x.id !== slug && x.genres.some((g) => a.genres.includes(g))
      ).slice(0, 12),
    };
  }
}

export function byFeatured(all: Anime[]): Anime[] {
  return all
    .filter((a) => a.featuredRank != null)
    .sort((a, b) => (a.featuredRank ?? 9) - (b.featuredRank ?? 9));
}

export function byTrending(all: Anime[]): Anime[] {
  return all
    .filter((a) => a.trendingRank != null)
    .sort((a, b) => (a.trendingRank ?? 99) - (b.trendingRank ?? 99));
}

export function byNewest(all: Anime[]): Anime[] {
  return [...all].sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));
}