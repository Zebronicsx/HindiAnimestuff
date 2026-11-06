"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { BookmarkCheck } from "lucide-react";
import { PosterCard, CardSkeleton } from "@/components/cards";
import { EmptyState } from "@/components/ui";
import { useLibrary } from "@/components/providers";
import type { Anime } from "@/lib/types";
import { getWatchlist } from "@/lib/store";

export default function MyListPage() {
  const { ids, loaded } = useLibrary();
  const [items, setItems] = useState<Anime[]>([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    setItems(getWatchlist().items);
    setFetching(false);
  }, []);

  // if something was added from elsewhere (undo, another tab section), refresh
  useEffect(() => {
    if (!loaded || fetching) return;
    const missing = [...ids].some((id) => !items.some((a) => a.id === id));
    if (missing) setItems(getWatchlist().items);
  }, [ids, loaded, items, fetching]);

  const visible = items.filter((a) => ids.has(a.id));
  const busy = fetching || !loaded;

  return (
    <div className="px-4 pb-16 pt-8 md:px-10 md:pt-10">
      <div className="mb-8 flex items-center gap-3">
        <span className="grid size-12 place-items-center rounded-2xl bg-mint/12 text-mint">
          <BookmarkCheck className="size-6" />
        </span>
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight md:text-3xl">My List</h1>
          <p className="text-[12.5px] font-medium text-dim">
            {busy ? "Load ho raha hai…" : `${visible.length} title${visible.length !== 1 ? "s" : ""} saved — tera personal watchlist`}
          </p>
        </div>
      </div>

      {busy ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <CardSkeleton key={i} className="w-full" />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <EmptyState
          title="List abhi khaali hai"
          sub="Kisi bhi poster par + dabao ya detail page se 'My List' karo — sab yahan save ho jayega."
          cta="Anime Explore Karo"
          href="/browse"
        />
      ) : (
        <motion.div layout className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6">
          <AnimatePresence mode="popLayout">
            {visible.map((a) => (
              <motion.div
                key={a.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.85 }}
                transition={{ duration: 0.25 }}
              >
                <PosterCard a={a} className="w-full" showRemove />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}