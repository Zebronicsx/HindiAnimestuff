"use client";

import Link from "next/link";
import { Play, Plus, Check } from "lucide-react";
import { useLibrary } from "@/components/providers";

export function TrendingListActions({ id, title }: { id: string; title: string }) {
  const { inList, toggle } = useLibrary();
  const saved = inList(id);
  return (
    <div className="flex shrink-0 items-center gap-2">
      <button
        onClick={() => toggle(id, title)}
        aria-label={saved ? "Remove from My List" : "Add to My List"}
        className={`focus-ring grid size-9 place-items-center rounded-full border transition ${
          saved
            ? "border-mint/50 bg-mint/15 text-mint"
            : "border-line text-mute hover:border-primary/60 hover:text-fg"
        }`}
      >
        {saved ? <Check className="size-4" /> : <Plus className="size-4" />}
      </button>
      <Link
        href={`/watch/${id}/1`}
        aria-label={`Watch ${title}`}
        className="btn-primary focus-ring grid size-9 place-items-center rounded-full"
      >
        <Play className="size-4 fill-white text-white" />
      </Link>
    </div>
  );
}