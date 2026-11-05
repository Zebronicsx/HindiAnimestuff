export type AnimeType = "series" | "movie";

export interface Anime {
  id: string;
  anilistId: number;
  title: string;
  romaji: string;
  synopsis: string;
  poster: string;
  banner: string | null;
  color: string | null;
  score: number;
  year: number;
  type: AnimeType;
  episodesCount: number;
  genres: string[];
  languages: string[];
  qualities: string[];
  studio: string;
  trendingRank: number | null;
  featuredRank: number | null;
  isNew: boolean;
  createdAt?: string;
}

export interface DownloadLink {
  quality: string;
  size: string;
  url: string;
}

export interface Episode {
  id: number;
  animeId: string;
  num: number;
  title: string;
  duration: number;
  stream: string;
  downloads: DownloadLink[];
}

export interface ProgressItem {
  animeId: string;
  episodeNum: number;
  position: number;
  duration: number;
  updatedAt: string;
  anime: Anime;
  episodeTitle: string;
}

export function fmtTime(sec: number): string {
  if (!Number.isFinite(sec) || sec < 0) sec = 0;
  const s = Math.floor(sec % 60);
  const m = Math.floor((sec / 60) % 60);
  const h = Math.floor(sec / 3600);
  const mm = h > 0 ? String(m).padStart(2, "0") : String(m);
  return `${h > 0 ? h + ":" : ""}${mm}:${String(s).padStart(2, "0")}`;
}

export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.max(1, Math.floor(diff / 60000));
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

export const TELEGRAM_URL = "https://t.me/HindiAnimestuff";