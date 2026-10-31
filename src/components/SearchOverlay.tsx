import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Search, Star } from "lucide-react";
import { AnimeItem, poster, searchItems, ratingOf } from "../lib/catalog";
import { href } from "../lib/router";

export default function SearchOverlay({
  open,
  onClose,
  items,
}: {
  open: boolean;
  onClose: () => void;
  items: AnimeItem[];
}) {
  const [q, setQ] = useState("");
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setQ("");
      setTimeout(() => input.current?.focus(), 80);
    }
  }, [open]);

  useEffect(() => {
    const fn = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [onClose]);

  const results = useMemo(() => searchItems(items, q), [items, q]);
  const suggestions = useMemo(
    () => [...items].sort((a, b) => ratingOf(b) - ratingOf(a)).slice(0, 12),
    [items]
  );
  const shown = q.trim() ? results : suggestions;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[150]"
        >
          <div className="absolute inset-0 bg-ink/92 backdrop-blur-xl blueprint-oni" onClick={onClose} />
          <div className="pointer-events-none absolute inset-0 grid place-items-center">
            <span className="text-stroke font-display text-[20vw] uppercase leading-none opacity-20 select-none">
              検索
            </span>
          </div>
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="relative mx-auto max-w-4xl px-5 pt-[10vh] md:pt-[14vh]"
          >
            <div className="border border-line bg-coal shadow-[0_40px_120px_-30px_rgba(255,42,42,0.4)]">
              <div className="flex items-center gap-4 border-b border-line px-6 md:px-8">
                <Search className="h-5 w-5 shrink-0 text-oni" />
                <input
                  ref={input}
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search anime, movies and series…"
                  className="w-full bg-transparent py-6 font-display text-lg uppercase tracking-wide placeholder:normal-case placeholder:text-ash/50 placeholder:font-body md:text-xl outline-none"
                />
                <button
                  onClick={onClose}
                  data-hover
                  className="shrink-0 border border-line px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.24em] text-ash transition-colors hover:border-oni hover:text-oni"
                >
                  Esc
                </button>
              </div>

              <div className="max-h-[58vh] overflow-y-auto p-4 md:p-5">
                <p className="flex items-center gap-3 px-1.5 pb-3 font-mono text-[10px] uppercase tracking-[0.3em] text-ash">
                  <Play className="h-3 w-3 fill-oni text-oni" />
                  {q.trim() ? `${results.length} signals found` : "Top rated in the vault"}
                  <span className="h-px flex-1 bg-line" />
                </p>
                {shown.length === 0 && (
                  <p className="py-12 text-center text-sm text-ash">
                    信号なし — no results. Try a different spelling or a shorter query.
                  </p>
                )}
                <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
                  {shown.map((it) => (
                    <a
                      key={it.id}
                      href={href(`/title/${it.id}`)}
                      data-hover
                      className="group relative aspect-[2/3] overflow-hidden border border-line bg-panel transition-colors hover:border-oni/60"
                    >
                      <img
                        src={poster(it, "w342")}
                        alt={it.title}
                        loading="lazy"
                        className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/20 to-transparent" />
                      <span className="absolute right-1.5 top-1.5 flex items-center gap-1 bg-ink/70 px-1.5 py-1 text-[10px] font-bold text-gold backdrop-blur-sm">
                        <Star className="h-2.5 w-2.5 fill-current" />
                        {it.rating}
                      </span>
                      <p className="absolute inset-x-0 bottom-0 p-2 font-display text-[12px] uppercase leading-tight text-paper line-clamp-2">
                        {it.title}
                      </p>
                    </a>
                  ))}
                </div>
              </div>
            </div>
            <p className="mt-5 text-center font-mono text-[10px] uppercase tracking-[0.35em] text-ash">
              {items.length} titles indexed · Esc to close
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
