"use client";

import { useEffect, useState } from "react";
import MediaRow from "./MediaRow";
import { ContinueCard } from "./cards";
import type { ProgressItem } from "@/lib/types";

export default function ContinueRow() {
  const [items, setItems] = useState<ProgressItem[]>([]);

  useEffect(() => {
    fetch("/api/progress")
      .then((r) => r.json())
      .then((d) => setItems((d.items ?? []).slice(0, 12)))
      .catch(() => {});
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