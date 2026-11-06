/**
 * Browser-only store. Replaces the old /api/* + Postgres layer so the site
 * can be exported as plain static files (Firebase Hosting, Cloudflare Pages, etc).
 * Watchlist and watch-progress live in localStorage on the visitor's device.
 */
import { CATALOG, buildEpisodes, fallbackAnime } from "./catalog";
import type { Anime, ProgressItem } from "./types";

const WL_KEY = "afs_watchlist_v1";
const PR_KEY = "afs_progress_v1";

interface WatchEntry {
  id: string;
  addedAt: string;
}

interface ProgressEntry {
  animeId: string;
  episodeNum: number;
  position: number;
  duration: number;
  updatedAt: string;
}

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage full or blocked (private mode) — fail silently */
  }
}

/* ------------------------------ watchlist ------------------------------ */

export function getWatchlist(): { ids: string[]; items: Anime[] } {
  const entries = read<WatchEntry[]>(WL_KEY, []).sort((a, b) =>
    b.addedAt.localeCompare(a.addedAt)
  );
  const items: Anime[] = [];
  for (const e of entries) {
    const a = fallbackAnime(e.id);
    if (a) items.push(a);
  }
  return { ids: items.map((a) => a.id), items };
}

export function addToWatchlist(id: string) {
  const entries = read<WatchEntry[]>(WL_KEY, []);
  if (entries.some((e) => e.id === id)) return;
  write(WL_KEY, [...entries, { id, addedAt: new Date().toISOString() }]);
}

export function removeFromWatchlist(id: string) {
  write(
    WL_KEY,
    read<WatchEntry[]>(WL_KEY, []).filter((e) => e.id !== id)
  );
}

/* ------------------------------- progress ------------------------------ */

export function getProgress(animeId?: string): ProgressItem[] {
  const entries = read<ProgressEntry[]>(PR_KEY, [])
    .filter((p) => !animeId || p.animeId === animeId)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, animeId ? 60 : 24);

  const epCache = new Map<string, ReturnType<typeof buildEpisodes>>();
  const items: ProgressItem[] = [];
  for (const p of entries) {
    const a = fallbackAnime(p.animeId);
    if (!a) continue;
    let eps = epCache.get(a.id);
    if (!eps) {
      eps = buildEpisodes(a);
      epCache.set(a.id, eps);
    }
    items.push({
      animeId: p.animeId,
      episodeNum: p.episodeNum,
      position: p.position,
      duration: p.duration,
      updatedAt: p.updatedAt,
      anime: a,
      episodeTitle: eps.find((e) => e.num === p.episodeNum)?.title ?? `Episode ${p.episodeNum}`,
    });
  }
  return items;
}

export function getEpisodePosition(animeId: string, episodeNum: number): number {
  return (
    read<ProgressEntry[]>(PR_KEY, []).find(
      (p) => p.animeId === animeId && p.episodeNum === episodeNum
    )?.position ?? 0
  );
}

export function saveProgress(
  animeId: string,
  episodeNum: number,
  position: number,
  duration: number
) {
  if (!animeId || !episodeNum) return;
  const entries = read<ProgressEntry[]>(PR_KEY, []).filter(
    (p) => !(p.animeId === animeId && p.episodeNum === episodeNum)
  );
  entries.push({
    animeId,
    episodeNum,
    position: Math.max(0, Math.round(position)),
    duration: Math.max(0, Math.round(duration)),
    updatedAt: new Date().toISOString(),
  });
  // keep the newest 200 entries so localStorage never grows unbounded
  entries.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  write(PR_KEY, entries.slice(0, 200));
}

/** Re-insert an entry with its original timestamp (used by "Undo"). */
export function restoreProgress(item: ProgressItem) {
  const entries = read<ProgressEntry[]>(PR_KEY, []).filter(
    (p) => !(p.animeId === item.animeId && p.episodeNum === item.episodeNum)
  );
  entries.push({
    animeId: item.animeId,
    episodeNum: item.episodeNum,
    position: item.position,
    duration: item.duration,
    updatedAt: item.updatedAt,
  });
  write(PR_KEY, entries);
}

export function deleteProgress(animeId: string, episodeNum: number) {
  write(
    PR_KEY,
    read<ProgressEntry[]>(PR_KEY, []).filter(
      (p) => !(p.animeId === animeId && p.episodeNum === episodeNum)
    )
  );
}

export function clearProgress() {
  write(PR_KEY, []);
}

/* -------------------------------- search ------------------------------- */

export function searchAnime(q: string, limit = 8): Anime[] {
  const qq = q.trim().toLowerCase();
  if (!qq) return [];
  return CATALOG.filter(
    (a) => a.title.toLowerCase().includes(qq) || a.romaji.toLowerCase().includes(qq)
  )
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

export function trendingAnime(limit = 6): Anime[] {
  return CATALOG.filter((a) => a.trendingRank != null)
    .sort((a, b) => (a.trendingRank ?? 99) - (b.trendingRank ?? 99))
    .slice(0, limit);
}
