/* eslint-disable @next/next/no-img-element */
"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Play, CheckCircle2, Send, ListVideo } from "lucide-react";
import { SectionHead } from "@/components/ui";
import { fmtTime, TELEGRAM_URL, type Anime, type Episode, type ProgressItem } from "@/lib/types";
import { getProgress } from "@/lib/store";

const CHUNK = 13;

export default function DetailEpisodes({ anime, episodes }: { anime: Anime; episodes: Episode[] }) {
  const [range, setRange] = useState(0);
  const [prog, setProg] = useState<Map<number, ProgressItem>>(new Map());

  useEffect(() => {
    const m = new Map<number, ProgressItem>();
    getProgress(anime.id).forEach((p) => m.set(p.episodeNum, p));
    setProg(m);
  }, [anime.id]);

  const chunks = Math.ceil(episodes.length / CHUNK);
  const visible = useMemo(
    () => episodes.slice(range * CHUNK, (range + 1) * CHUNK),
    [episodes, range]
  );

  return (
    <section>
      <SectionHead
        title={anime.type === "movie" ? "The Film" : `Episodes (${episodes.length})`}
        sub={`${anime.languages[0]} audio • ${anime.qualities[anime.qualities.length - 1]} tak • MP4 stream + download`}
      />

      {chunks > 1 && (
        <div className="mb-4 flex flex-wrap gap-2 px-1">
          {Array.from({ length: chunks }).map((_, i) => (
            <button
              key={i}
              onClick={() => setRange(i)}
              className={`focus-ring rounded-full px-4 py-1.5 text-[12px] font-bold transition ${
                range === i
                  ? "bg-primary text-white shadow-glow"
                  : "border border-line text-mute hover:border-primary/50 hover:text-fg"
              }`}
            >
              EP {i * CHUNK + 1}–{Math.min((i + 1) * CHUNK, episodes.length)}
            </button>
          ))}
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {visible.map((e) => {
          const p = prog.get(e.num);
          const pct = p && p.duration > 0 ? Math.min(100, (p.position / p.duration) * 100) : 0;
          const done = pct >= 95;
          return (
            <Link
              key={e.num}
              href={`/watch/${anime.id}/${e.num}`}
              className="focus-ring group flex gap-3.5 rounded-2xl border border-white/[0.05] bg-surface/70 p-3 transition hover:border-primary/50 hover:bg-raised"
            >
              <div className="relative aspect-video w-32 shrink-0 overflow-hidden rounded-lg sm:w-36">
                <img
                  src={anime.banner ?? anime.poster}
                  alt=""
                  loading="lazy"
                  className="absolute inset-0 h-full w-full object-cover transition duration-300 group-hover:scale-105"
                  style={{ objectPosition: `${(e.num * 17) % 100}% center` }}
                />
                <div className="absolute inset-0 bg-black/40 transition group-hover:bg-black/20" />
                <span className="absolute left-1.5 top-1.5 rounded bg-black/70 px-1.5 py-0.5 text-[9.5px] font-extrabold text-white">
                  {anime.type === "movie" ? "MOVIE" : `EP ${e.num}`}
                </span>
                <span className="absolute bottom-1.5 right-1.5 rounded bg-black/70 px-1.5 py-0.5 text-[9.5px] font-bold text-white/80">
                  {fmtTime(e.duration)}
                </span>
                <span className="absolute inset-0 m-auto grid size-9 place-items-center rounded-full bg-primary opacity-0 shadow-glow transition group-hover:opacity-100">
                  <Play className="size-4 fill-white text-white" />
                </span>
                {pct > 0 && (
                  <span className="absolute inset-x-0 bottom-0 h-[3px] bg-white/20">
                    <span className="block h-full bg-primary" style={{ width: `${pct}%` }} />
                  </span>
                )}
              </div>
              <div className="min-w-0 flex-1 py-0.5">
                <p className="flex items-center gap-1.5 text-[10.5px] font-extrabold uppercase tracking-wider text-primary-soft">
                  {anime.type === "movie" ? "Full Movie" : `Episode ${e.num}`}
                  {done && <CheckCircle2 className="size-3.5 text-mint" />}
                </p>
                <p className="mt-1 line-clamp-2 text-[13px] font-bold leading-snug text-fg">{e.title}</p>
                <p className="mt-1.5 text-[10.5px] font-semibold text-dim">
                  {done ? "Dekha ja chuka ✓" : pct > 0 ? `${fmtTime(Math.max(0, (p?.duration ?? e.duration) - (p?.position ?? 0)))} left` : "Hindi Dub • Multi Audio"}
                </p>
              </div>
            </Link>
          );
        })}
      </div>

      {anime.type === "series" && anime.episodesCount > episodes.length && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-cyanic/25 bg-cyanic/[0.06] px-5 py-4">
          <p className="flex items-center gap-2 text-[12.5px] font-semibold text-mute">
            <ListVideo className="size-4 shrink-0 text-cyanic" />
            EP 1–{episodes.length} yahan stream karo • baaki {anime.episodesCount - episodes.length} episodes Telegram par milenge
          </p>
          <a
            href={TELEGRAM_URL}
            target="_blank"
            rel="noreferrer"
            className="focus-ring flex items-center gap-1.5 rounded-full bg-cyanic/15 px-4 py-2 text-[12px] font-bold text-cyanic transition hover:bg-cyanic/25"
          >
            <Send className="size-3.5" /> Join karo
          </a>
        </div>
      )}
    </section>
  );
}