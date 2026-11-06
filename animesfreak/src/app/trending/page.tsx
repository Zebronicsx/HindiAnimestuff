/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { Flame, Play, Star, Plus } from "lucide-react";
import { getAll, byTrending } from "@/lib/data";
import { Reveal } from "@/components/ui";
import { TrendingListActions } from "./actions";

export default async function TrendingPage() {
  const all = await getAll();
  const top = byTrending(all);
  const podium = top.slice(0, 3);
  const rest = top.slice(3);

  return (
    <div className="px-4 pb-16 pt-8 md:px-10 md:pt-10">
      <Reveal>
        <div className="mb-8 flex items-center gap-3">
          <span className="grid size-12 place-items-center rounded-2xl bg-primary/15 text-primary-soft shadow-glow">
            <Flame className="size-6" />
          </span>
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight md:text-3xl">
              Trending in India
            </h1>
            <p className="text-[12.5px] font-medium text-dim">
              Top 10 — jo abhi sab binge kar rahe hain 🔥
            </p>
          </div>
        </div>
      </Reveal>

      {/* podium */}
      <div className="grid gap-4 md:grid-cols-3">
        {podium.map((a, i) => (
          <Reveal key={a.id} delay={i * 0.08}>
            <div className="group relative overflow-hidden rounded-2xl border border-white/[0.07] bg-raised shadow-card transition hover:border-primary/60">
              <Link href={`/anime/${a.id}`} className="focus-ring block">
                <div className="relative aspect-[16/10] overflow-hidden">
                  <img
                    src={a.banner ?? a.poster}
                    alt={a.title}
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/30 to-transparent" />
                  <span className="rank-num absolute -bottom-3 left-3 text-[110px] font-bold">{i + 1}</span>
                  <div className="absolute bottom-3 left-24 right-3">
                    <p className="line-clamp-2 font-display text-[16px] font-bold leading-tight text-white">{a.title}</p>
                    <p className="mt-1 flex items-center gap-2 text-[11px] font-semibold text-white/60">
                      <span className="flex items-center gap-0.5 text-gold">
                        <Star className="size-3 fill-gold" /> {a.score.toFixed(1)}
                      </span>
                      {a.year} • {a.type === "movie" ? "Movie" : `${a.episodesCount} EP`}
                    </p>
                  </div>
                </div>
              </Link>
              <div className="flex items-center justify-between gap-2 p-3">
                <span className="truncate text-[11px] font-bold uppercase tracking-wider text-primary-soft">
                  Hindi Dub • {a.qualities[a.qualities.length - 1]}
                </span>
                <Link
                  href={`/watch/${a.id}/1`}
                  className="btn-primary focus-ring flex shrink-0 items-center gap-1.5 rounded-full px-4 py-1.5 text-[11.5px] font-extrabold text-white"
                >
                  <Play className="size-3 fill-white" /> Watch
                </Link>
              </div>
            </div>
          </Reveal>
        ))}
      </div>

      {/* ranks 4-10 */}
      <div className="mt-8 space-y-2.5">
        {rest.map((a, i) => (
          <Reveal key={a.id} delay={Math.min(i * 0.04, 0.3)}>
            <div className="group flex items-center gap-4 rounded-2xl border border-white/[0.05] bg-surface/70 p-3 transition hover:border-primary/40 hover:bg-raised sm:gap-6 sm:px-5">
              <span className="rank-num w-10 shrink-0 text-center text-4xl font-bold sm:w-14 sm:text-5xl">
                {i + 4}
              </span>
              <Link href={`/anime/${a.id}`} className="focus-ring shrink-0 overflow-hidden rounded-lg">
                <img src={a.poster} alt={a.title} className="h-[76px] w-[54px] object-cover transition group-hover:scale-105" loading="lazy" />
              </Link>
              <div className="min-w-0 flex-1">
                <Link href={`/anime/${a.id}`} className="focus-ring block truncate text-[14.5px] font-bold text-fg transition hover:text-primary-soft">
                  {a.title}
                </Link>
                <p className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11px] font-semibold text-dim">
                  <span className="flex items-center gap-0.5 text-gold">
                    <Star className="size-3 fill-gold" /> {a.score.toFixed(1)}
                  </span>
                  <span>{a.year}</span>
                  <span className="hidden sm:inline">{a.genres.slice(0, 3).join(" • ")}</span>
                  <span className="rounded bg-primary/10 px-1.5 py-px text-primary-soft">Hindi</span>
                </p>
              </div>
              <TrendingListActions id={a.id} title={a.title} />
            </div>
          </Reveal>
        ))}
      </div>

      <Reveal>
        <div className="mt-10 flex justify-center">
          <Link
            href="/browse"
            className="focus-ring flex items-center gap-2 rounded-full border border-line bg-white/[0.03] px-6 py-3 text-sm font-bold text-mute transition hover:border-primary/60 hover:text-fg"
          >
            <Plus className="size-4 text-primary-soft" /> Poora catalog explore karo
          </Link>
        </div>
      </Reveal>
    </div>
  );
}