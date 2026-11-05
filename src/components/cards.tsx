/* eslint-disable @next/next/no-img-element */
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Play, Plus, Check, Star, X, RotateCcw } from "lucide-react";
import { useLibrary } from "./providers";
import { fmtTime, type Anime, type ProgressItem } from "@/lib/types";

export function PosterCard({
  a,
  className = "w-[148px] sm:w-[165px] md:w-[180px]",
  showRemove = false,
}: {
  a: Anime;
  className?: string;
  showRemove?: boolean;
}) {
  const { inList, toggle } = useLibrary();
  const router = useRouter();
  const saved = inList(a.id);

  return (
    <div className={`group relative shrink-0 snap-start ${className}`}>
      <Link
        href={`/anime/${a.id}`}
        className="focus-ring block overflow-hidden rounded-xl border border-white/[0.06] bg-raised shadow-card transition-all duration-300 group-hover:border-primary/60 group-hover:shadow-glow"
      >
        <div className="relative aspect-[2/3] overflow-hidden">
          <img
            src={a.poster}
            alt={a.title}
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.07]"
          />
          <div className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-black/95 via-black/45 to-transparent" />
          <div className="absolute left-2 top-2 flex flex-col items-start gap-1">
            <span className="glass flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-bold text-gold">
              <Star className="size-2.5 fill-gold" /> {a.score.toFixed(1)}
            </span>
            {a.isNew && (
              <span className="rounded-full bg-primary px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-white shadow-glow">
                New Dub
              </span>
            )}
          </div>
          <span className="absolute right-2 top-2 rounded-md bg-black/60 px-1.5 py-0.5 text-[9.5px] font-bold text-cyanic backdrop-blur-sm">
            {a.qualities.includes("4K") ? "4K" : "1080p"}
          </span>
          <div className="absolute inset-x-0 bottom-0 p-2.5">
            <p className="line-clamp-2 text-[12.5px] font-bold leading-tight text-white">{a.title}</p>
            <p className="mt-1 text-[10px] font-semibold text-white/50">
              {a.year} • {a.type === "movie" ? "Movie" : `${a.episodesCount} EP`} • Hindi
            </p>
          </div>
        </div>
      </Link>

      {/* hover actions */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center gap-2.5 rounded-xl bg-black/45 opacity-0 backdrop-blur-[2px] transition-all duration-300 group-hover:opacity-100">
        <button
          onClick={() => router.push(`/watch/${a.id}/1`)}
          aria-label={`Watch ${a.title}`}
          className="btn-primary focus-ring pointer-events-auto grid size-11 scale-75 place-items-center rounded-full transition-transform duration-300 group-hover:scale-100"
        >
          <Play className="size-4.5 fill-white text-white" />
        </button>
        <button
          onClick={() => toggle(a.id, a.title)}
          aria-label={saved ? "Remove from My List" : "Add to My List"}
          className={`focus-ring pointer-events-auto grid size-9 scale-75 place-items-center rounded-full border transition-all duration-300 group-hover:scale-100 ${
            saved
              ? "border-mint/60 bg-mint/20 text-mint"
              : "border-white/30 bg-white/10 text-white hover:border-primary hover:bg-primary/30"
          }`}
        >
          {saved ? <Check className="size-4" /> : <Plus className="size-4" />}
        </button>
        {showRemove && (
          <button
            onClick={() => toggle(a.id, a.title)}
            aria-label="Remove"
            className="focus-ring pointer-events-auto absolute right-2 top-2 grid size-7 place-items-center rounded-full bg-black/70 text-white/70 transition hover:bg-primary hover:text-white"
          >
            <X className="size-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}

export function RankCard({ a, rank }: { a: Anime; rank: number }) {
  return (
    <div className="flex shrink-0 snap-start items-end">
      <span className="rank-num relative z-0 -mr-4 select-none text-[96px] font-bold sm:-mr-5 sm:text-[124px]">
        {rank}
      </span>
      <PosterCard a={a} className="relative z-10 w-[124px] sm:w-[142px]" />
    </div>
  );
}

export function ContinueCard({
  item,
  onRemove,
  wide = false,
}: {
  item: ProgressItem;
  onRemove?: (item: ProgressItem) => void;
  wide?: boolean;
}) {
  const a = item.anime;
  const pct = item.duration > 0 ? Math.min(100, (item.position / item.duration) * 100) : 0;
  const done = pct >= 95;
  const left = Math.max(0, item.duration - item.position);

  return (
    <div
      className={`group relative shrink-0 snap-start overflow-hidden rounded-xl border border-white/[0.06] bg-raised shadow-card transition-all duration-300 hover:border-primary/60 hover:shadow-glow ${
        wide ? "w-full" : "w-[270px] sm:w-[300px]"
      }`}
    >
      <Link href={`/watch/${a.id}/${item.episodeNum}`} className="focus-ring block">
        <div className="relative aspect-video overflow-hidden">
          <img
            src={a.banner ?? a.poster}
            alt={a.title}
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.06]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/25 to-black/10" />
          <span className="absolute inset-0 m-auto grid size-11 place-items-center rounded-full bg-black/50 opacity-80 backdrop-blur-sm transition group-hover:bg-primary group-hover:opacity-100 group-hover:shadow-glow">
            {done ? <RotateCcw className="size-4.5 text-white" /> : <Play className="size-4.5 fill-white text-white" />}
          </span>
          <span className="absolute right-2 top-2 rounded-md bg-black/60 px-1.5 py-0.5 text-[9.5px] font-bold text-white/80 backdrop-blur-sm">
            {done ? "Watched ✓" : `${fmtTime(left)} left`}
          </span>
          <div className="absolute inset-x-0 bottom-0 p-3">
            <p className="truncate text-[13px] font-bold text-white">{a.title}</p>
            <p className="mt-0.5 truncate text-[10.5px] font-semibold text-white/55">
              {a.type === "movie" ? "Movie" : `E${item.episodeNum}`} • {item.episodeTitle}
            </p>
          </div>
        </div>
        <div className="h-[3px] w-full bg-white/10">
          <div
            className="h-full rounded-r-full bg-gradient-to-r from-primary to-primary-soft"
            style={{ width: `${done ? 100 : pct}%` }}
          />
        </div>
      </Link>
      {onRemove && (
        <button
          onClick={() => onRemove(item)}
          aria-label="Remove from history"
          className="focus-ring absolute left-2 top-2 grid size-7 place-items-center rounded-full bg-black/70 text-white/60 opacity-0 transition hover:bg-primary hover:text-white group-hover:opacity-100"
        >
          <X className="size-3.5" />
        </button>
      )}
    </div>
  );
}

export function CardSkeleton({ className = "w-[148px] sm:w-[165px] md:w-[180px]" }: { className?: string }) {
  return (
    <div className={`shrink-0 ${className}`}>
      <div className="skeleton aspect-[2/3] rounded-xl" />
    </div>
  );
}