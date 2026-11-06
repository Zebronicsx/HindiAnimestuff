import { CATALOG, buildEpisodes, fallbackAnime } from "./catalog";
import type { Anime, Episode } from "./types";

// Static data layer: everything comes from the bundled catalog at build time.
// (Kept async so existing `await getAll()` call sites keep working.)

export async function getAll(): Promise<Anime[]> {
  return [...CATALOG].sort((a, b) => b.score - a.score);
}

export async function getDetail(slug: string): Promise<{
  anime: Anime;
  episodes: Episode[];
  related: Anime[];
} | null> {
  const a = fallbackAnime(slug);
  if (!a) return null;
  return {
    anime: a,
    episodes: buildEpisodes(a),
    related: CATALOG.filter(
      (x) => x.id !== slug && x.genres.some((g) => a.genres.includes(g))
    )
      .sort((x, y) => y.score - x.score)
      .slice(0, 12),
  };
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
