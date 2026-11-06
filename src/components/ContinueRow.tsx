"use client";

import { useEffect, useState } from "react";
import MediaRow from "./MediaRow";
import { ContinueCard } from "./cards";
import type { ProgressItem } from "@/lib/types";
import { getProgress } from "@/lib/store";

export default function ContinueRow() {
  const [items, setItems] = useState<ProgressItem[]>([]);

  useEffect(() => {
    setItems(getProgress().slice(0, 12));
  }, []);

  if (items.length === 0) return null;

  return (
    <MediaRow title="Continue Watching" sub="Wahin se shuru karo jahan chhoda tha" href="/history">
      {items.map((it) => (
        <ContinueCard key={`${it.animeId}-${it.episodeNum}`} item={it} />
      ))}
    </MediaRow>
  );
}