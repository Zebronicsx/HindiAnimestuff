/* eslint-disable @next/next/no-img-element */
"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Play, Plus, Check, Star, Info, ChevronLeft, ChevronRight, Sparkles, Mic2 } from "lucide-react";
import { useLibrary } from "./providers";
import type { Anime } from "@/lib/types";

const DUR = 8;

export default function Hero({ items }: { items: Anime[] }) {
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const [pct, setPct] = useState(0);
  const { inList, toggle } = useLibrary();

  const next = useCallback(() => setIdx((i) => (i + 1) % items.length), [items.length]);
  const prev = () => setIdx((i) => (i - 1 + items.length) % items.length);

  useEffect(() => setPct(0), [idx]);
  useEffect(() => {
    if (paused || items.length < 2) return;
    const t = setInterval(() => setPct((p) => Math.min(100, p + 10 / DUR)), 100);
    return () => clearInterval(t);
  }, [paused, items.length]);
  useEffect(() => {
    if (pct >= 100) next();
  }, [pct, next]);

  if (items.length === 0) return null;
  const a = items[idx];
  const saved = inList(a.id);

  return (
    <section
      className="relative flex min-h-[600px] flex-col justify-end overflow-hidden md:min-h-[640px]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* backdrop */}
      <AnimatePresence mode="sync">
        <motion.div
          key={a.id}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.9, ease: "easeOut" }}
          className="absolute inset-0"
        >
          <img
            src={a.banner ?? a.poster}
            alt=""
            className="absolute inset-0 h-full w-full object-cover object-center"
          />
          <img
            src={a.banner ?? a.poster}
            alt=""
            aria-hidden
            className="absolute inset-0 h-full w-full scale-125 object-cover opacity-40 blur-3xl"
          />
        </motion.div>
      </AnimatePresence>
      <div className="hero-scrim absolute inset-0" />
      {/* accent glow from cover color */}
      <div
        className="pointer-events-none absolute -left-32 top-1/3 size-[420px] rounded-full opacity-25 blur-[130px]"
        style={{ background: a.color ?? "#f31260" }}
      />

      {/* top-right controls */}
      <div className="absolute right-5 top-20 z-20 hidden items-center gap-2 md:flex lg:right-10 lg:top-8">
        <span className="font-display mr-1 text-xs font-bold tracking-[0.2em] text-white/50">
          {String(idx + 1).padStart(2, "0")} / {String(items.length).padStart(2, "0")}
        </span>
        <button onClick={prev} aria-label="Previous" className="focus-ring glass grid size-9 place-items-center rounded-full text-white/80 transition hover:border-primary/60 hover:text-white">
          <ChevronLeft className="size-4.5" />
        </button>
        <button onClick={next} aria-label="Next" className="focus-ring glass grid size-9 place-items-center rounded-full text-white/80 transition hover:border-primary/60 hover:text-white">
          <ChevronRight className="size-4.5" />
        </button>
      </div>

      <div className="relative z-10 flex items-end gap-10 px-5 pb-4 pt-32 md:px-10 md:pt-24">
        {/* info */}
        <div className="min-w-0 max-w-2xl flex-1">
          <AnimatePresence mode="wait">
            <motion.div
              key={a.id}
              initial={{ opacity: 0, y: 26 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -14 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="mb-3.5 flex flex-wrap items-center gap-2">
                <span className="flex items-center gap-1.5 rounded-full bg-primary px-3 py-1 text-[10.5px] font-extrabold uppercase tracking-widest text-white shadow-glow">
                  <Sparkles className="size-3" /> Spotlight #{idx + 1}
                </span>
                <span className="flex items-center gap-1.5 rounded-full border border-cyanic/40 bg-cyanic/10 px-3 py-1 text-[10.5px] font-extrabold uppercase tracking-widest text-cyanic">
                  <Mic2 className="size-3" /> Hindi Dub
                </span>
              </div>

              <h1 className="font-display text-4xl font-bold leading-[1.04] tracking-tight text-white drop-shadow-lg sm:text-5xl xl:text-[64px]">
                {a.title}
              </h1>
              <p className="mt-2 truncate text-[11px] font-semibold uppercase tracking-[0.25em] text-white/40">
                {a.romaji}
              </p>

              <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 text-[12.5px] font-semibold text-white/80">
                <span className="flex items-center gap-1 rounded-md bg-gold/15 px-2 py-0.5 font-bold text-gold">
                  <Star className="size-3.5 fill-gold" /> {a.score.toFixed(1)}
                </span>
                <span>{a.year}</span>
                <span className="size-1 rounded-full bg-white/30" />
                <span>{a.type === "movie" ? "Movie" : `${a.episodesCount} Episodes`}</span>
                <span className="size-1 rounded-full bg-white/30" />
                <span className="rounded border border-white/25 px-1.5 py-px text-[10px] font-bold text-white/70">
                  {a.qualities[a.qualities.length - 1]}
                </span>
                <span className="hidden items-center gap-1.5 sm:flex">
                  {a.genres.slice(0, 3).map((g) => (
                    <span key={g} className="rounded-full bg-white/10 px-2.5 py-0.5 text-[10.5px] font-semibold text-white/75 backdrop-blur-sm">
                      {g}
                    </span>
                  ))}
                </span>
              </div>

              <p className="mt-4 line-clamp-3 max-w-xl text-[13.5px] leading-relaxed text-white/65">
                {a.synopsis}
              </p>

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <Link
                  href={`/watch/${a.id}/1`}
                  className="btn-primary focus-ring flex items-center gap-2 rounded-full px-7 py-3 text-sm font-extrabold text-white"
                >
                  <Play className="size-4 fill-white" /> Abhi Dekho
                </Link>
                <button
                  onClick={() => toggle(a.id, a.title)}
                  className={`focus-ring glass flex items-center gap-2 rounded-full px-5 py-3 text-sm font-bold transition ${
                    saved ? "border-mint/50 text-mint" : "text-white hover:border-white/40"
                  }`}
                >
                  {saved ? <Check className="size-4" /> : <Plus className="size-4" />}
                  {saved ? "Listed" : "My List"}
                </button>
                <Link
                  href={`/anime/${a.id}`}
                  className="focus-ring flex items-center gap-1.5 rounded-full px-4 py-3 text-sm font-bold text-white/60 transition hover:text-white"
                >
                  <Info className="size-4" /> Details
                </Link>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* floating poster */}
        <AnimatePresence mode="wait">
          <motion.div
            key={a.id}
            initial={{ opacity: 0, x: 40, rotate: 5 }}
            animate={{ opacity: 1, x: 0, rotate: 2 }}
            exit={{ opacity: 0, x: -20, rotate: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="relative hidden shrink-0 xl:block"
          >
            <div
              className="absolute -inset-6 rounded-[32px] opacity-40 blur-3xl"
              style={{ background: a.color ?? "#f31260" }}
            />
            <Link href={`/anime/${a.id}`} className="focus-ring animate-float relative block">
              <img
                src={a.poster}
                alt={a.title}
                className="w-[230px] rounded-2xl border border-white/20 object-cover shadow-card"
              />
            </Link>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* thumbnail selector — Sora style */}
      <div className="relative z-10 mt-6 px-5 pb-6 md:px-10">
        <div className="no-scrollbar flex gap-3 overflow-x-auto pb-1">
          {items.map((t, i) => (
            <button
              key={t.id}
              onClick={() => setIdx(i)}
              aria-label={`Show ${t.title}`}
              className={`focus-ring relative aspect-video w-[130px] shrink-0 overflow-hidden rounded-xl border-2 transition-all duration-300 sm:w-[150px] ${
                i === idx
                  ? "border-primary shadow-glow"
                  : "border-transparent opacity-50 hover:opacity-90"
              }`}
            >
              <img src={t.banner ?? t.poster} alt="" className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent" />
              {i === idx && (
                <>
                  <span className="absolute inset-x-2 bottom-1.5 truncate text-left text-[10px] font-bold text-white">
                    {t.title}
                  </span>
                  <span className="absolute inset-x-0 top-0 h-[3px] bg-white/15">
                    <span
                      className="block h-full bg-primary"
                      style={{ width: `${pct}%`, transition: "width 0.12s linear" }}
                    />
                  </span>
                </>
              )}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}