/* eslint-disable @next/next/no-img-element */
"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Compass, Search, X, SlidersHorizontal, ChevronDown } from "lucide-react";
import { PosterCard } from "@/components/cards";
import type { Anime } from "@/lib/types";

const SORTS = [
  { v: "popular", l: "Top Rated" },
  { v: "trending", l: "Trending" },
  { v: "newest", l: "Latest Added" },
  { v: "az", l: "A → Z" },
];

export default function BrowseClient({ initial, genres }: { initial: Anime[]; genres: string[] }) {
  const sp = useSearchParams();
  const [q, setQ] = useState(sp.get("q") ?? "");
  const [genre, setGenre] = useState(sp.get("genre") ?? "");
  const [type, setType] = useState(sp.get("type") ?? "");
  const [sort, setSort] = useState(sp.get("sort") ?? "popular");

  const syncUrl = (next: Record<string, string>) => {
    const p = new URLSearchParams();
    const merged = { q, genre, type, sort, ...next };
    Object.entries(merged).forEach(([k, v]) => {
      if (v && !(k === "sort" && v === "popular")) p.set(k, v);
    });
    const s = p.toString();
    window.history.replaceState(null, "", s ? `/browse?${s}` : "/browse");
  };

  const items = useMemo(() => {
    let list = [...initial];
    const qq = q.trim().toLowerCase();
    if (qq)
      list = list.filter(
        (a) => a.title.toLowerCase().includes(qq) || a.romaji.toLowerCase().includes(qq)
      );
    if (genre) list = list.filter((a) => a.genres.includes(genre));
    if (type) list = list.filter((a) => a.type === type);
    if (sort === "trending") list.sort((a, b) => (a.trendingRank ?? 99) - (b.trendingRank ?? 99));
    else if (sort === "newest")
      list.sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));
    else if (sort === "az") list.sort((a, b) => a.title.localeCompare(b.title));
    else list.sort((a, b) => b.score - a.score);
    return list;
  }, [initial, q, genre, type, sort]);

  const hasFilters = q !== "" || genre !== "" || type !== "" || sort !== "popular";
  const reset = () => {
    setQ(""); setGenre(""); setType(""); setSort("popular");
    window.history.replaceState(null, "", "/browse");
  };

  return (
    <div className="px-4 pb-16 pt-8 md:px-10 md:pt-10">
      <div className="mb-6 flex items-center gap-3">
        <span className="grid size-12 place-items-center rounded-2xl bg-cyanic/12 text-cyanic">
          <Compass className="size-6" />
        </span>
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight md:text-3xl">Discover</h1>
          <p className="text-[12.5px] font-medium text-dim">
            {initial.length} titles • sab Hindi mein available
          </p>
        </div>
      </div>

      {/* controls */}
      <div className="sticky top-14 z-30 -mx-4 mb-6 space-y-3 border-b border-line/60 bg-ink/85 px-4 py-3 backdrop-blur-xl md:top-0 md:-mx-10 md:px-10">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-0 flex-1 basis-64">
            <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-dim" />
            <input
              value={q}
              onChange={(e) => { setQ(e.target.value); syncUrl({ q: e.target.value }); }}
              placeholder="Title se search karo…"
              className="focus-ring w-full rounded-full border border-line bg-surface py-2.5 pl-10 pr-9 text-[13px] font-medium text-fg outline-none transition placeholder:text-dim focus:border-primary/60"
            />
            {q && (
              <button
                onClick={() => { setQ(""); syncUrl({ q: "" }); }}
                aria-label="Clear search"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-dim hover:text-fg"
              >
                <X className="size-4" />
              </button>
            )}
          </div>

          <div className="flex rounded-full border border-line bg-surface p-1">
            {[
              { v: "", l: "All" },
              { v: "series", l: "Series" },
              { v: "movie", l: "Movies" },
            ].map((t) => (
              <button
                key={t.v}
                onClick={() => { setType(t.v); syncUrl({ type: t.v }); }}
                className={`focus-ring rounded-full px-4 py-1.5 text-[12px] font-bold transition ${
                  type === t.v ? "bg-primary text-white shadow-glow" : "text-mute hover:text-fg"
                }`}
              >
                {t.l}
              </button>
            ))}
          </div>

          <div className="relative">
            <SlidersHorizontal className="pointer-events-none absolute left-3.5 top-1/2 size-3.5 -translate-y-1/2 text-dim" />
            <select
              value={sort}
              onChange={(e) => { setSort(e.target.value); syncUrl({ sort: e.target.value }); }}
              aria-label="Sort by"
              className="focus-ring appearance-none rounded-full border border-line bg-surface py-2.5 pl-9 pr-9 text-[12px] font-bold text-fg outline-none transition focus:border-primary/60"
            >
              {SORTS.map((s) => (
                <option key={s.v} value={s.v} className="bg-surface">{s.l}</option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 size-3.5 -translate-y-1/2 text-dim" />
          </div>

          {hasFilters && (
            <button
              onClick={reset}
              className="focus-ring flex items-center gap-1 rounded-full px-3 py-2 text-[12px] font-bold text-primary-soft transition hover:bg-primary/10"
            >
              <X className="size-3.5" /> Reset
            </button>
          )}
        </div>

        <div className="no-scrollbar flex gap-2 overflow-x-auto pb-0.5">
          <button
            onClick={() => { setGenre(""); syncUrl({ genre: "" }); }}
            className={`focus-ring shrink-0 rounded-full px-3.5 py-1.5 text-[11.5px] font-bold transition ${
              genre === "" ? "bg-fg text-ink" : "border border-line text-mute hover:border-primary/50 hover:text-fg"
            }`}
          >
            Sab Genres
          </button>
          {genres.map((g) => (
            <button
              key={g}
              onClick={() => { const v = genre === g ? "" : g; setGenre(v); syncUrl({ genre: v }); }}
              className={`focus-ring shrink-0 rounded-full px-3.5 py-1.5 text-[11.5px] font-bold transition ${
                genre === g
                  ? "bg-primary text-white shadow-glow"
                  : "border border-line text-mute hover:border-primary/50 hover:text-fg"
              }`}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      <p className="mb-4 px-1 text-[12px] font-semibold text-dim">
        <span className="text-fg">{items.length}</span> result{items.length !== 1 ? "s" : ""}
        {genre && <> in <span className="text-primary-soft">{genre}</span></>}
        {q && <> for "<span className="text-primary-soft">{q}</span>"</>}
      </p>

      {items.length === 0 ? (
        <div className="flex flex-col items-center rounded-3xl border border-dashed border-line bg-surface/40 px-6 py-14 text-center">
          <img src="/img/mascot.png" alt="" className="mb-5 size-28 rounded-3xl object-cover opacity-90" />
          <h3 className="font-display text-lg font-bold">Kuch nahi mila 😔</h3>
          <p className="mt-1.5 max-w-sm text-[13px] text-mute">
            Filters thode tight hain shayad. Reset karke dobara try karo.
          </p>
          <button onClick={reset} className="btn-primary focus-ring mt-6 rounded-full px-6 py-2.5 text-sm font-bold text-white">
            Filters Reset Karo
          </button>
        </div>
      ) : (
        <motion.div layout className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
          <AnimatePresence mode="popLayout">
            {items.map((a) => (
              <motion.div
                key={a.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.25 }}
              >
                <PosterCard a={a} className="w-full" />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}