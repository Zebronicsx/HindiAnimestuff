/* eslint-disable @next/next/no-img-element */
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Search, X, Star, Clock, Flame, Loader2, CornerDownLeft } from "lucide-react";
import { useUI } from "./providers";
import type { Anime } from "@/lib/types";
import { searchAnime, trendingAnime } from "@/lib/store";

const RECENT_KEY = "afs_recent";

export default function SearchOverlay() {
  const { searchOpen, setSearchOpen } = useUI();
  const router = useRouter();
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Anime[]>([]);
  const [trending, setTrending] = useState<Anime[]>([]);
  const [recent, setRecent] = useState<Anime[]>([]);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // global shortcut
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen(!searchOpen);
      }
      if (e.key === "Escape") setSearchOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [searchOpen, setSearchOpen]);

  useEffect(() => {
    if (searchOpen) {
      setQ("");
      setResults([]);
      setActive(0);
      try {
        setRecent(JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]"));
      } catch { setRecent([]); }
      if (trending.length === 0) setTrending(trendingAnime(6));
      document.body.style.overflow = "hidden";
      setTimeout(() => inputRef.current?.focus(), 60);
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchOpen]);

  useEffect(() => {
    if (!q.trim()) { setResults([]); setLoading(false); return; }
    setLoading(true);
    const t = setTimeout(() => {
      setResults(searchAnime(q, 8));
      setActive(0);
      setLoading(false);
    }, 120);
    return () => clearTimeout(t);
  }, [q]);

  const go = useCallback(
    (a: Anime) => {
      try {
        const next = [a, ...recent.filter((r) => r.id !== a.id)].slice(0, 5);
        localStorage.setItem(RECENT_KEY, JSON.stringify(next));
      } catch {}
      setSearchOpen(false);
      router.push(`/anime/${a.id}`);
    },
    [recent, router, setSearchOpen]
  );

  const list = q.trim() ? results : recent.length ? recent : trending;

  const onInputKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setActive((i) => Math.min(i + 1, list.length - 1)); }
    if (e.key === "ArrowUp") { e.preventDefault(); setActive((i) => Math.max(i - 1, 0)); }
    if (e.key === "Enter" && list[active]) { e.preventDefault(); go(list[active]); }
  };

  return (
    <AnimatePresence>
      {searchOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[85] bg-black/70 backdrop-blur-sm"
          onClick={() => setSearchOpen(false)}
        >
          <motion.div
            initial={{ opacity: 0, y: -18, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 380, damping: 32 }}
            onClick={(e) => e.stopPropagation()}
            className="mx-auto mt-[10vh] w-[min(94vw,620px)] overflow-hidden rounded-3xl border border-line bg-surface shadow-card"
          >
            <div className="flex items-center gap-3 border-b border-line px-5 py-4">
              {loading ? (
                <Loader2 className="size-5 shrink-0 animate-spin text-primary-soft" />
              ) : (
                <Search className="size-5 shrink-0 text-primary-soft" />
              )}
              <input
                ref={inputRef}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={onInputKey}
                placeholder="Anime dhoondo… (Solo Leveling, Jujutsu, One Piece)"
                className="w-full bg-transparent text-[15px] font-medium text-fg outline-none placeholder:text-dim"
              />
              <button
                onClick={() => setSearchOpen(false)}
                className="focus-ring grid size-8 shrink-0 place-items-center rounded-lg border border-line text-dim transition hover:text-fg"
                aria-label="Close search"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="max-h-[52vh] overflow-y-auto p-2.5">
              {!q.trim() && (
                <p className="flex items-center gap-1.5 px-3 pb-1.5 pt-2 text-[10.5px] font-bold uppercase tracking-[0.18em] text-dim">
                  {recent.length ? <><Clock className="size-3" /> Recent searches</> : <><Flame className="size-3 text-primary-soft" /> Trending abhi</>}
                </p>
              )}
              {q.trim() && !loading && results.length === 0 && (
                <div className="px-4 py-10 text-center">
                  <p className="text-sm font-semibold text-mute">"{q}" ke liye kuch nahi mila 😔</p>
                  <p className="mt-1 text-xs text-dim">Spelling check karo ya Telegram par request bhejo.</p>
                </div>
              )}
              {list.map((a, i) => (
                <button
                  key={a.id}
                  onClick={() => go(a)}
                  onMouseEnter={() => setActive(i)}
                  className={`flex w-full items-center gap-3.5 rounded-2xl px-3 py-2.5 text-left transition ${
                    i === active ? "bg-white/[0.07]" : ""
                  }`}
                >
                  <img src={a.poster} alt="" className="h-14 w-10 shrink-0 rounded-lg object-cover" loading="lazy" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13.5px] font-bold text-fg">{a.title}</span>
                    <span className="mt-0.5 flex items-center gap-2 text-[11px] font-medium text-dim">
                      <span className="flex items-center gap-0.5 text-gold">
                        <Star className="size-3 fill-gold" /> {a.score.toFixed(1)}
                      </span>
                      <span>{a.year}</span>
                      <span className="rounded bg-white/5 px-1.5 py-px uppercase">{a.type}</span>
                      <span className="hidden text-primary-soft sm:inline">Hindi Dub</span>
                    </span>
                  </span>
                  {i === active && <CornerDownLeft className="size-4 shrink-0 text-dim" />}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-4 border-t border-line bg-ink/50 px-5 py-2.5 text-[10.5px] font-semibold text-dim">
              <span><kbd className="rounded border border-line px-1">↑↓</kbd> navigate</span>
              <span><kbd className="rounded border border-line px-1">↵</kbd> open</span>
              <span><kbd className="rounded border border-line px-1">esc</kbd> close</span>
              <span className="ml-auto hidden text-primary-soft/70 sm:inline">35 titles • Hindi audio</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}