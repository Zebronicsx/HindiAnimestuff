"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Play, Plus, Check, Share2, Send } from "lucide-react";
import { useLibrary, useToast } from "@/components/providers";
import { TELEGRAM_URL, type Anime, type ProgressItem } from "@/lib/types";
import { getProgress } from "@/lib/store";

export default function DetailActions({ anime }: { anime: Anime }) {
  const { inList, toggle } = useLibrary();
  const { toast } = useToast();
  const [resumeEp, setResumeEp] = useState<number | null>(null);
  const saved = inList(anime.id);

  useEffect(() => {
    const items: ProgressItem[] = getProgress(anime.id);
    const unfinished = items.find(
      (p) => p.duration === 0 || p.position / p.duration < 0.95
    );
    if (unfinished) setResumeEp(unfinished.episodeNum);
  }, [anime.id]);

  const watchHref = `/watch/${anime.id}/${resumeEp ?? 1}`;
  const share = async () => {
    const url = `${window.location.origin}/anime/${anime.id}`;
    try {
      await navigator.clipboard.writeText(url);
      toast("Link copy ho gaya — doston ko bhejo!", { type: "success" });
    } catch {
      toast(url, { type: "info" });
    }
  };

  return (
    <div className="mt-6 flex flex-wrap items-center gap-3">
      <Link
        href={watchHref}
        className="btn-primary focus-ring flex items-center gap-2 rounded-full px-7 py-3 text-sm font-extrabold text-white"
      >
        <Play className="size-4 fill-white" />
        {anime.type === "movie"
          ? resumeEp ? "Continue Movie" : "Play Movie"
          : resumeEp ? `Continue E${resumeEp}` : "Watch E1"}
      </Link>
      <button
        onClick={() => toggle(anime.id, anime.title)}
        className={`focus-ring glass flex items-center gap-2 rounded-full px-5 py-3 text-sm font-bold transition ${
          saved ? "border-mint/50 text-mint" : "text-fg hover:border-white/40"
        }`}
      >
        {saved ? <Check className="size-4" /> : <Plus className="size-4" />}
        {saved ? "My List mein hai" : "My List"}
      </button>
      <button
        onClick={share}
        aria-label="Share"
        className="focus-ring glass grid size-11 place-items-center rounded-full text-mute transition hover:border-white/40 hover:text-fg"
      >
        <Share2 className="size-4" />
      </button>
      <a
        href={TELEGRAM_URL}
        target="_blank"
        rel="noreferrer"
        className="focus-ring flex items-center gap-2 rounded-full bg-cyanic/12 px-5 py-3 text-sm font-bold text-cyanic transition hover:bg-cyanic/25"
      >
        <Send className="size-4" /> Telegram
      </a>
    </div>
  );
}