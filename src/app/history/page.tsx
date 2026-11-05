"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { History, Trash2 } from "lucide-react";
import { ContinueCard } from "@/components/cards";
import { EmptyState } from "@/components/ui";
import { useToast } from "@/components/providers";
import type { ProgressItem } from "@/lib/types";

export default function HistoryPage() {
  const { toast } = useToast();
  const [items, setItems] = useState<ProgressItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/progress")
      .then((r) => r.json())
      .then((d) => setItems(d.items ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const restore = (list: ProgressItem[]) => {
    list.forEach((it) => {
      fetch("/api/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          animeId: it.animeId,
          episodeNum: it.episodeNum,
          position: it.position,
          duration: it.duration,
        }),
      }).catch(() => {});
    });
    setItems((prev) =>
      [...list, ...prev.filter((p) => !list.some((l) => l.animeId === p.animeId && l.episodeNum === p.episodeNum))]
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    );
  };

  const removeOne = (it: ProgressItem) => {
    setItems((prev) => prev.filter((p) => !(p.animeId === it.animeId && p.episodeNum === it.episodeNum)));
    fetch(`/api/progress?animeId=${encodeURIComponent(it.animeId)}&ep=${it.episodeNum}`, { method: "DELETE" }).catch(() => {});
    toast(`${it.anime.title} history se hata diya`, {
      type: "info",
      action: { label: "Undo", onClick: () => restore([it]) },
    });
  };

  const clearAll = () => {
    const snapshot = [...items];
    setItems([]);
    fetch("/api/progress?all=1", { method: "DELETE" }).catch(() => {});
    toast("Poori history saaf ho gayi", {
      type: "info",
      action: { label: "Undo", onClick: () => restore(snapshot) },
    });
  };

  const watching = items.filter((i) => i.duration === 0 || i.position / i.duration < 0.95);
  const done = items.filter((i) => i.duration > 0 && i.position / i.duration >= 0.95);

  return (
    <div className="px-4 pb-16 pt-8 md:px-10 md:pt-10">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="grid size-12 place-items-center rounded-2xl bg-gold/12 text-gold">
            <History className="size-6" />
          </span>
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight md:text-3xl">History</h1>
            <p className="text-[12.5px] font-medium text-dim">
              Continue watching + jo dekh chuke ho
            </p>
          </div>
        </div>
        {items.length > 0 && (
          <button
            onClick={clearAll}
            className="focus-ring flex items-center gap-2 rounded-full border border-line px-4 py-2 text-[12px] font-bold text-mute transition hover:border-primary/60 hover:text-primary-soft"
          >
            <Trash2 className="size-3.5" /> Clear All
          </button>
        )}
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="skeleton aspect-video rounded-xl" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          title="Kuch dekha hi nahi abhi tak"
          sub="Koi episode play karo — progress apne aap yahan save hota rahega, device band karke bhi."
          cta="Kuch Play Karo"
          href="/"
        />
      ) : (
        <div className="space-y-10">
          {watching.length > 0 && (
            <section>
              <h2 className="font-display mb-4 text-lg font-bold">
                Continue Watching <span className="ml-1 text-sm font-semibold text-dim">({watching.length})</span>
              </h2>
              <motion.div layout className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                <AnimatePresence mode="popLayout">
                  {watching.map((it) => (
                    <motion.div key={`${it.animeId}-${it.episodeNum}`} layout exit={{ opacity: 0, scale: 0.9 }} transition={{ duration: 0.2 }}>
                      <ContinueCard item={it} wide onRemove={removeOne} />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>
            </section>
          )}
          {done.length > 0 && (
            <section>
              <h2 className="font-display mb-4 text-lg font-bold">
                Dekhe Ja Chuke <span className="ml-1 text-sm font-semibold text-dim">({done.length})</span>
              </h2>
              <motion.div layout className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                <AnimatePresence mode="popLayout">
                  {done.map((it) => (
                    <motion.div key={`${it.animeId}-${it.episodeNum}`} layout exit={{ opacity: 0, scale: 0.9 }} transition={{ duration: 0.2 }}>
                      <ContinueCard item={it} wide onRemove={removeOne} />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}