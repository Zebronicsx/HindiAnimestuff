/* ------------------------------------------------------------------ */
/*  AnimesFreak — data layer                                          */
/* ------------------------------------------------------------------ */

export type Quality = "480p" | "720p" | "1080p";
export const QUALITY_ORDER: Quality[] = ["1080p", "720p", "480p"];

export interface AnimeItem {
  id: string;
  category: "anime" | "movies" | "series" | string;
  season: string;
  title: string;
  poster: string;
  rating: string;
  genres: string[];
  quality_tag: string;
  episode_tag: string;
  languages: string[];
  runtime: string;
  subtitle: string;
  episodes: string;
  type: "Movie" | "TV Series" | "OVA" | string;
  trending?: boolean;
  description: string;
  downloads: Partial<Record<Quality, string>>;
  episode_links: Record<string, Partial<Record<Quality, string>>>;
}

/* ------------------------------------------------------------------ */
/*  Embedded catalog                                                  */
/*  The whole dataset ships inside the build (tokenised by scripts).  */
/*  No runtime fetch → works on localhost, Cloudflare, Vercel,        */
/*  Firebase and even when index.html is opened straight from disk.    */
/* ------------------------------------------------------------------ */

import catalogRaw from "../data/catalog.json?raw";
import { emblemImg } from "../assets/images";

const WORKER = "https://icy-feather-221c.jakcminasi.workers.dev/?id=";
const TMDB = "https://image.tmdb.org/t/p/original/";

const CATEGORIES = ["anime", "movies", "series"] as const;
const TYPES = ["TV Series", "Movie", "OVA"] as const;
const QK: Quality[] = ["480p", "720p", "1080p"];

/** Original host naming: [Visit On Telegram @HindiAnimestuff] <file> */
export const FILE_TAG = "[Visit On Telegram @HindiAnimestuff] ";

/** W<id>|<name>  → worker url · T<path> → tmdb url · anything else = raw */
function decodeUrl(value: string | null | undefined): string | undefined {
  if (!value) return undefined;
  if (value[0] === "W") {
    const rest = value.slice(1);
    const bar = rest.indexOf("|");
    if (bar === -1) return WORKER + rest;
    const id = rest.slice(0, bar);
    const name = rest.slice(bar + 1);
    // rebuild the exact original filename, tag included
    return `${WORKER}${id}&name=${encodeURIComponent(FILE_TAG + name)}`;
  }
  if (value[0] === "T") return TMDB + value.slice(1);
  return value;
}

type RawRow = [
  string, number, string, string, string | null, string, string, string, string, string,
  string, string, string, number, number, string,
  Record<string, string | null> | null,
  (string | null)[][] | null
];

let cache: AnimeItem[] | null = null;
let byId: Map<string, AnimeItem> | null = null;

export function loadCatalog(): Promise<AnimeItem[]> {
  if (cache) return Promise.resolve(cache);

  const parsed = JSON.parse(catalogRaw) as { v: number; items: RawRow[] };
  const items: AnimeItem[] = parsed.items.map((row) => {
    const [
      id, cat, season, title, posterPath, rating, genres, qualityTag, episodeTag, langs,
      runtime, subtitle, episodes, type, trending, description, downloads, episodeLinks,
    ] = row;

    const dl: Partial<Record<Quality, string>> = {};
    if (downloads) {
      for (const q of QK) {
        const url = decodeUrl(downloads[q]);
        if (url) dl[q] = url;
      }
    }

    const eps: Record<string, Partial<Record<Quality, string>>> = {};
    if (episodeLinks) {
      for (const epRow of episodeLinks) {
        const [ep, q480, q720, q1080] = epRow;
        if (!ep) continue;
        const entry: Partial<Record<Quality, string>> = {};
        const urls = [q480, q720, q1080];
        QK.forEach((q, i) => {
          const url = decodeUrl(urls[i]);
          if (url) entry[q] = url;
        });
        eps[ep] = entry;
      }
    }

    return {
      id,
      category: CATEGORIES[cat] ?? "anime",
      season,
      title,
      poster: decodeUrl(posterPath) ?? "",
      rating,
      genres: genres ? genres.split(",").filter(Boolean) : [],
      quality_tag: qualityTag,
      episode_tag: episodeTag,
      languages: langs ? langs.split(",").filter(Boolean) : [],
      runtime,
      subtitle,
      episodes,
      type: TYPES[type] ?? "TV Series",
      trending: trending === 1,
      description,
      downloads: dl,
      episode_links: eps,
    };
  });

  items.sort((a, b) => (b.trending ? 1 : 0) - (a.trending ? 1 : 0));
  cache = items;
  byId = new Map(items.map((i) => [i.id, i]));
  return Promise.resolve(items);
}

export function getById(id: string): AnimeItem | undefined {
  return byId?.get(id);
}

/* ---------------- helpers ---------------- */

export const ratingOf = (i: AnimeItem) => parseFloat(i.rating) || 0;

export const hasEpisodes = (i: AnimeItem) =>
  !!i.episode_links && Object.keys(i.episode_links).length > 0;

export const hasDownloads = (i: AnimeItem) =>
  !!i.downloads && Object.keys(i.downloads).length > 0;

export function episodeList(i: AnimeItem): string[] {
  return Object.keys(i.episode_links || {}).sort(
    (a, b) => parseInt(a, 10) - parseInt(b, 10)
  );
}

export function qualitiesFor(
  i: AnimeItem,
  ep?: string
): { q: Quality; url: string }[] {
  const src = ep ? i.episode_links?.[ep] : i.downloads;
  if (!src) return [];
  return QUALITY_ORDER.filter((q) => src[q]).map((q) => ({ q, url: src[q]! }));
}

/** first available episode number */
export const firstEpisode = (i: AnimeItem) => episodeList(i)[0];

/* ---------------- media format helpers ---------------- */

export type MediaFormat = "MP4" | "MKV" | "FILE";

/**
 * Build the exact original download filename (tag included) without ever
 * exposing the underlying URL anywhere in the UI.
 */
export function fileNameFromUrl(url: string): string {
  try {
    const u = new URL(url);
    const n = u.searchParams.get("name");
    if (n) return decodeURIComponent(n);
    const p = decodeURIComponent(u.pathname.split("/").filter(Boolean).pop() || "");
    return p || `${FILE_TAG}AnimesFreak.mkv`;
  } catch {
    return `${FILE_TAG}AnimesFreak.mkv`;
  }
}

/** Never render a raw URL — the UI only ever receives a label. */
export function safeLinkLabel(url: string): string {
  const name = fileNameFromUrl(url);
  const ext = (name.match(/\.(mkv|mp4|avi|webm)$/i)?.[1] ?? "mkv").toLowerCase();
  return `${FILE_TAG}${name.replace(/\.[^.]+$/, "")}.${ext}`;
}

export function formatOf(url: string): MediaFormat {
  const probe = `${fileNameFromUrl(url)} ${url.split("?")[0]}`.toLowerCase();
  if (/\.mp4\b/.test(probe)) return "MP4";
  if (/\.mkv\b/.test(probe)) return "MKV";
  return "FILE";
}

/** MP4 streams natively; MKV/HEVC needs an external player */
export const isBrowserPlayable = (url?: string) => !!url && formatOf(url) === "MP4";

/** picks an MP4 link when the source offers one, else 720p x264, else 480p, else 1080p */
export function preferredQuality(i: AnimeItem, ep?: string): Quality {
  const qs = qualitiesFor(i, ep);
  const mp4 = qs.find((x) => formatOf(x.url) === "MP4");
  if (mp4) return mp4.q;
  const order: Quality[] = ["720p", "480p", "1080p"];
  return order.find((q) => qs.some((x) => x.q === q)) ?? qs[0]?.q ?? "720p";
}

/** rewrites tmdb image url to a smaller size for fast grids */
export function poster(i: AnimeItem, size: "w342" | "w500" | "w780" | "original" = "w500") {
  if (!i.poster) return emblemImg; // graceful oni-crest fallback for unlisted art
  return i.poster.replace("/t/p/original/", `/t/p/${size}/`);
}

export const isHindi = (i: AnimeItem) => i.languages?.includes("Hindi");

export function searchItems(items: AnimeItem[], query: string): AnimeItem[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const terms = q.split(/\s+/);
  return items
    .filter((i) => {
      const hay = `${i.title} ${i.genres.join(" ")} ${i.languages.join(" ")}`.toLowerCase();
      return terms.every((t) => hay.includes(t));
    })
    .sort((a, b) => ratingOf(b) - ratingOf(a))
    .slice(0, 60);
}

/* ---------------- curated collections ---------------- */

export function collections(items: AnimeItem[]) {
  const anime = items.filter((i) => i.category === "anime");
  const movies = items.filter((i) => i.category === "movies");
  const series = items.filter((i) => i.category === "series");

  const trending = [
    ...items.filter((i) => i.trending),
    ...[...anime].sort((a, b) => ratingOf(b) - ratingOf(a)),
  ]
    .filter((v, idx, arr) => arr.findIndex((x) => x.id === v.id) === idx)
    .slice(0, 14);

  const topRated = [...items]
    .filter((i) => ratingOf(i) >= 7.5)
    .sort((a, b) => ratingOf(b) - ratingOf(a))
    .slice(0, 18);

  const featured = trending.slice(0, 6);

  const genreRow = (g: string, n = 16) =>
    items
      .filter((i) => i.genres.includes(g))
      .sort((a, b) => ratingOf(b) - ratingOf(a))
      .slice(0, n);

  return { anime, movies, series, trending, topRated, featured, genreRow };
}

/* ---------------- my list (localStorage) ---------------- */

const LIST_KEY = "af-mylist";
const listeners = new Set<() => void>();

export function getMyList(): string[] {
  try {
    return JSON.parse(localStorage.getItem(LIST_KEY) || "[]");
  } catch {
    return [];
  }
}

export function toggleMyList(id: string): boolean {
  const list = getMyList();
  const idx = list.indexOf(id);
  if (idx >= 0) list.splice(idx, 1);
  else list.unshift(id);
  try {
    localStorage.setItem(LIST_KEY, JSON.stringify(list));
  } catch {
    /* private mode / file:// with storage disabled */
  }
  listeners.forEach((f) => f());
  return idx < 0;
}

export function onMyListChange(f: () => void) {
  listeners.add(f);
  return () => {
    listeners.delete(f);
  };
}

/* ---------------- watch progress ---------------- */

export interface Progress {
  t: number;
  dur: number;
  ts: number;
  ep?: string;
  q?: Quality;
}

const PROG_KEY = "af-progress";

function readProg(): Record<string, Progress> {
  try {
    return JSON.parse(localStorage.getItem(PROG_KEY) || "{}");
  } catch {
    return {};
  }
}

export const progKey = (id: string, ep?: string) => (ep ? `${id}::${ep}` : id);

export function setProgress(id: string, p: Progress) {
  const all = readProg();
  all[progKey(id, p.ep)] = p;
  // keep last 60 entries
  const keys = Object.keys(all);
  if (keys.length > 60) {
    keys
      .sort((a, b) => all[b].ts - all[a].ts)
      .slice(60)
      .forEach((k) => delete all[k]);
  }
  try {
    localStorage.setItem(PROG_KEY, JSON.stringify(all));
  } catch {
    /* storage unavailable — playback still works for the session */
  }
}

export function getProgress(id: string, ep?: string): Progress | undefined {
  return readProg()[progKey(id, ep)];
}

export function allProgress(): Record<string, Progress> {
  return readProg();
}

export function clearProgress(id: string, ep?: string) {
  const all = readProg();
  delete all[progKey(id, ep)];
  try {
    localStorage.setItem(PROG_KEY, JSON.stringify(all));
  } catch {
    /* ignore */
  }
}

/* ---------------- formatting ---------------- */

export function fmtTime(s: number): string {
  if (!isFinite(s) || s < 0) s = 0;
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = Math.floor(s % 60);
  return h > 0
    ? `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`
    : `${m}:${String(sec).padStart(2, "0")}`;
}
