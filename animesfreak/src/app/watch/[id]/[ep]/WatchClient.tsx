/* eslint-disable @next/next/no-img-element */
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronLeft, Play, Plus, Check, Download, Share2, Send,
  CheckCircle2, HardDrive, Keyboard,
} from "lucide-react";
import Player from "@/components/Player";
import { getEpisodePosition, getProgress, saveProgress as storeSaveProgress } from "@/lib/store";
import { useLibrary, useToast } from "@/components/providers";
import { fmtTime, TELEGRAM_URL, type Anime, type Episode, type ProgressItem } from "@/lib/types";

export default function WatchClient({
  anime,
  episodes,
  episode,
}: {
  anime: Anime;
  episodes: Episode[];
  episode: Episode;
}) {
  const router = useRouter();
  const { inList, toggle } = useLibrary();
  const { toast } = useToast();
  const [finished, setFinished] = useState(false);
  const [count, setCount] = useState(6);
  const [showDl, setShowDl] = useState(false);
  const [progMap, setProgMap] = useState<Map<number, ProgressItem>>(new Map());
  const dlRef = useRef<HTMLDivElement>(null);
  const saved = inList(anime.id);

  const next = episodes.find((e) => e.num === episode.num + 1);

  const [initialPos, setInitialPos] = useState(0);

  useEffect(() => {
    const m = new Map<number, ProgressItem>();
    getProgress(anime.id).forEach((x) => m.set(x.episodeNum, x));
    setProgMap(m);
    setInitialPos(getEpisodePosition(anime.id, episode.num));
  }, [anime.id, episode.num]);

  const saveProgress = useCallback(
    (pos: number, dur: number) => {
      storeSaveProgress(anime.id, episode.num, pos, dur);
    },
    [anime.id, episode.num]
  );

  /* auto-next countdown */
  useEffect(() => {
    if (!finished || !next) return;
    setCount(6);
    const t = setInterval(() => setCount((c) => c - 1), 1000);
    return () => clearInterval(t);
  }, [finished, next]);

  useEffect(() => {
    if (finished && next && count <= 0) router.push(`/watch/${anime.id}/${next.num}`);
  }, [count, finished, next, router, anime.id]);

  const openDownloads = () => {
    setShowDl(true);
    setTimeout(() => dlRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }), 120);
  };

  const share = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast("Episode link copy ho gaya!", { type: "success" });
    } catch {
      toast("Copy nahi hua — URL manually share karo", { type: "info" });
    }
  };

  const ringLen = 2 * Math.PI * 26;

  return (
    <div className="px-4 pb-16 pt-5 md:px-8 md:pt-6">
      {/* breadcrumb */}
      <div className="mb-4 flex items-center justify-between gap-3">
        <Link
          href={`/anime/${anime.id}`}
          className="focus-ring flex min-w-0 items-center gap-1.5 rounded-full text-[12.5px] font-bold text-mute transition hover:text-fg"
        >
          <ChevronLeft className="size-4 shrink-0" />
          <span className="truncate">{anime.title}</span>
        </Link>
        <span className="shrink-0 rounded-full border border-line bg-surface px-3 py-1 text-[10.5px] font-extrabold uppercase tracking-widest text-dim">
          {anime.type === "movie" ? "Movie" : `EP ${episode.num} / ${episodes.length}`}
        </span>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        {/* main column */}
        <div className="min-w-0">
          <div className="relative">
            <Player
              src={episode.stream}
              poster={anime.banner ?? anime.poster}
              title={anime.title}
              epLabel={anime.type === "movie" ? episode.title : `Episode ${episode.num} • ${episode.title}`}
              backHref={`/anime/${anime.id}`}
              initialPos={initialPos}
              hasNext={Boolean(next)}
              onNext={() => next && router.push(`/watch/${anime.id}/${next.num}`)}
              onEnded={() => { saveProgress(episode.duration, episode.duration); setFinished(true); }}
              onProgress={saveProgress}
              onDownloads={openDownloads}
            />

            {/* end overlay */}
            <AnimatePresence>
              {finished && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-5 rounded-2xl bg-black/90 px-6 text-center backdrop-blur-sm"
                >
                  {next ? (
                    <>
                      <p className="text-[11px] font-extrabold uppercase tracking-[0.25em] text-primary-soft">Up Next</p>
                      <div className="flex items-center gap-4">
                        <img src={anime.banner ?? anime.poster} alt="" className="hidden h-20 w-36 rounded-xl object-cover sm:block" />
                        <div className="text-left">
                          <p className="font-display text-lg font-bold text-white">Episode {next.num}</p>
                          <p className="text-[12.5px] font-semibold text-mute">{next.title}</p>
                        </div>
                      </div>
                      <div className="relative grid size-16 place-items-center">
                        <svg className="absolute inset-0 -rotate-90" viewBox="0 0 60 60">
                          <circle cx="30" cy="30" r="26" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="4" />
                          <circle
                            cx="30" cy="30" r="26" fill="none" stroke="#f31260" strokeWidth="4" strokeLinecap="round"
                            strokeDasharray={ringLen}
                            strokeDashoffset={ringLen * (1 - Math.max(0, count) / 6)}
                            style={{ transition: "stroke-dashoffset 1s linear" }}
                          />
                        </svg>
                        <span className="font-display text-lg font-bold text-white">{Math.max(0, count)}</span>
                      </div>
                      <div className="flex gap-3">
                        <button
                          onClick={() => router.push(`/watch/${anime.id}/${next.num}`)}
                          className="btn-primary focus-ring flex items-center gap-2 rounded-full px-6 py-2.5 text-sm font-extrabold text-white"
                        >
                          <Play className="size-4 fill-white" /> Abhi Play Karo
                        </button>
                        <button
                          onClick={() => setFinished(false)}
                          className="focus-ring glass rounded-full px-5 py-2.5 text-sm font-bold text-fg"
                        >
                          Rehne Do
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="size-12 text-mint" />
                      <div>
                        <p className="font-display text-xl font-bold text-white">Khatam! 🎬</p>
                        <p className="mt-1 text-[13px] text-mute">
                          {anime.type === "movie" ? "Movie complete — kaisi lagi?" : "Ye season ke saare episodes nipat gaye."}
                        </p>
                      </div>
                      <div className="flex flex-wrap justify-center gap-3">
                        <Link href="/browse" className="btn-primary focus-ring rounded-full px-6 py-2.5 text-sm font-extrabold text-white">
                          Aur Anime Dhoondo
                        </Link>
                        <button onClick={() => setFinished(false)} className="focus-ring glass rounded-full px-5 py-2.5 text-sm font-bold text-fg">
                          Wapas Player
                        </button>
                      </div>
                    </>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* info + actions */}
          <div className="mt-5 flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[10.5px] font-extrabold uppercase tracking-[0.22em] text-primary-soft">
                {anime.type === "movie" ? "Full Movie • Hindi Dub" : `Episode ${episode.num} • Hindi Dub`}
              </p>
              <h1 className="font-display mt-1 text-xl font-bold leading-tight md:text-2xl">{episode.title}</h1>
              <p className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11.5px] font-semibold text-dim">
                <Link href={`/anime/${anime.id}`} className="text-mute transition hover:text-primary-soft">{anime.title}</Link>
                <span>•</span>
                <span>{fmtTime(episode.duration)}</span>
                <span>•</span>
                <span>{anime.languages.join(" + ")} Audio</span>
                <span>•</span>
                <span className="text-cyanic">{anime.qualities.join(" / ")}</span>
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <button
                onClick={() => toggle(anime.id, anime.title)}
                className={`focus-ring flex items-center gap-1.5 rounded-full border px-4 py-2 text-[12px] font-bold transition ${
                  saved ? "border-mint/50 bg-mint/10 text-mint" : "border-line text-mute hover:border-primary/60 hover:text-fg"
                }`}
              >
                {saved ? <Check className="size-3.5" /> : <Plus className="size-3.5" />}
                {saved ? "Listed" : "My List"}
              </button>
              <button
                onClick={() => setShowDl((s) => !s)}
                className={`focus-ring flex items-center gap-1.5 rounded-full border px-4 py-2 text-[12px] font-bold transition ${
                  showDl ? "border-primary bg-primary/15 text-primary-soft" : "border-line text-mute hover:border-primary/60 hover:text-fg"
                }`}
              >
                <Download className="size-3.5" /> Download
              </button>
              <button
                onClick={share}
                aria-label="Share episode"
                className="focus-ring grid size-9 place-items-center rounded-full border border-line text-mute transition hover:border-primary/60 hover:text-fg"
              >
                <Share2 className="size-3.5" />
              </button>
            </div>
          </div>

          {/* downloads panel */}
          <AnimatePresence>
            {showDl && (
              <motion.div
                ref={dlRef}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="mt-4 rounded-2xl border border-line bg-surface/70 p-4 md:p-5">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="flex items-center gap-2 text-[13px] font-bold">
                      <HardDrive className="size-4 text-primary-soft" />
                      Download — {anime.type === "movie" ? "Movie" : `E${episode.num}`} (Hindi Audio)
                    </p>
                    <a href={TELEGRAM_URL} target="_blank" rel="noreferrer" className="focus-ring flex items-center gap-1 text-[11.5px] font-bold text-cyanic hover:underline">
                      <Send className="size-3" /> MKV chahiye? Telegram
                    </a>
                  </div>
                  <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
                    {episode.downloads.map((d) => (
                      <a
                        key={d.quality}
                        href={d.url}
                        download
                        target="_blank"
                        rel="noreferrer"
                        className="focus-ring group/dl flex items-center justify-between rounded-xl border border-line bg-raised px-4 py-3 transition hover:border-primary/60 hover:shadow-glow"
                      >
                        <span>
                          <span className="block text-[13px] font-extrabold text-fg">{d.quality}</span>
                          <span className="text-[10.5px] font-semibold text-dim">{d.size} • MP4</span>
                        </span>
                        <span className="grid size-8 place-items-center rounded-full bg-primary/15 text-primary-soft transition group-hover/dl:bg-primary group-hover/dl:text-white">
                          <Download className="size-3.5" />
                        </span>
                      </a>
                    ))}
                  </div>
                  <p className="mt-3 text-[10.5px] leading-relaxed text-dim">
                    Tip: MP4 har jagah chalta hai. Original MKV (x265) releases ke liye Telegram join karo — browser MKV play nahi kar sakta, VLC/MX Player use karo.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* shortcuts */}
          <div className="mt-5 hidden flex-wrap items-center gap-x-4 gap-y-2 text-[10.5px] font-semibold text-dim md:flex">
            <span className="flex items-center gap-1.5"><Keyboard className="size-3.5" /> Shortcuts:</span>
            {[["Space", "Play/Pause"], ["← →", "±10s"], ["M", "Mute"], ["F", "Fullscreen"], ["N", "Next EP"], ["P", "PiP"]].map(([k, v]) => (
              <span key={k} className="flex items-center gap-1.5">
                <kbd className="rounded-md border border-line bg-surface px-1.5 py-0.5 text-[9.5px] font-bold text-mute">{k}</kbd> {v}
              </span>
            ))}
          </div>
        </div>

        {/* episode sidebar */}
        <aside className="min-w-0">
          <div className="overflow-hidden rounded-2xl border border-line bg-surface/60">
            <div className="flex items-center justify-between border-b border-line px-4 py-3">
              <p className="font-display text-[14px] font-bold">Episodes</p>
              <span className="rounded-full bg-primary/12 px-2.5 py-0.5 text-[10.5px] font-extrabold text-primary-soft">
                {episodes.length} available
              </span>
            </div>
            <div className="max-h-[540px] overflow-y-auto p-2">
              {episodes.map((e) => {
                const active = e.num === episode.num;
                const pr = progMap.get(e.num);
                const pct = pr && pr.duration > 0 ? Math.min(100, (pr.position / pr.duration) * 100) : 0;
                return (
                  <Link
                    key={e.num}
                    href={`/watch/${anime.id}/${e.num}`}
                    className={`focus-ring flex items-center gap-3 rounded-xl border p-2 transition ${
                      active
                        ? "border-primary/60 bg-primary/10"
                        : "border-transparent hover:border-line hover:bg-white/[0.03]"
                    }`}
                  >
                    <span className={`font-display w-6 shrink-0 text-center text-[13px] font-bold ${active ? "text-primary-soft" : "text-dim"}`}>
                      {e.num}
                    </span>
                    <span className="relative aspect-video w-24 shrink-0 overflow-hidden rounded-lg">
                      <img
                        src={anime.banner ?? anime.poster}
                        alt=""
                        loading="lazy"
                        className="absolute inset-0 h-full w-full object-cover"
                        style={{ objectPosition: `${(e.num * 23) % 100}% center` }}
                      />
                      <span className="absolute inset-0 bg-black/30" />
                      {active ? (
                        <span className="absolute inset-0 flex items-end justify-center gap-[3px] pb-2.5">
                          <span className="w-[3px] animate-pulse rounded-full bg-primary" style={{ height: 10 }} />
                          <span className="w-[3px] animate-pulse rounded-full bg-primary" style={{ height: 16, animationDelay: "0.2s" }} />
                          <span className="w-[3px] animate-pulse rounded-full bg-primary" style={{ height: 7, animationDelay: "0.4s" }} />
                        </span>
                      ) : (
                        <span className="absolute bottom-1 right-1 rounded bg-black/75 px-1 py-px text-[8.5px] font-bold text-white/85">
                          {fmtTime(e.duration)}
                        </span>
                      )}
                      {pct > 0 && !active && (
                        <span className="absolute inset-x-0 bottom-0 h-[2.5px] bg-white/20">
                          <span className="block h-full bg-primary" style={{ width: `${pct}%` }} />
                        </span>
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className={`block truncate text-[12px] font-bold ${active ? "text-fg" : "text-mute"}`}>
                        {e.title}
                      </span>
                      <span className="mt-0.5 flex items-center gap-1 text-[10px] font-semibold text-dim">
                        {active ? (
                          <span className="text-primary-soft">Now Playing</span>
                        ) : pct >= 95 ? (
                          <span className="flex items-center gap-1 text-mint"><CheckCircle2 className="size-3" /> Watched</span>
                        ) : (
                          <>EP {e.num} • Hindi</>
                        )}
                      </span>
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>

          {next && (
            <Link
              href={`/watch/${anime.id}/${next.num}`}
              className="focus-ring group mt-4 flex items-center gap-3 rounded-2xl border border-line bg-surface/60 p-3 transition hover:border-primary/60"
            >
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-primary/15 text-primary-soft transition group-hover:bg-primary group-hover:text-white group-hover:shadow-glow">
                <Play className="size-4 fill-current" />
              </span>
              <span className="min-w-0">
                <span className="block text-[10px] font-extrabold uppercase tracking-widest text-dim">Up Next</span>
                <span className="block truncate text-[13px] font-bold text-fg">E{next.num} • {next.title}</span>
              </span>
            </Link>
          )}
        </aside>
      </div>
    </div>
  );
}