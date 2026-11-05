/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { Clapperboard, Play, Star, Info, Popcorn } from "lucide-react";
import { getAll } from "@/lib/data";
import { PosterCard } from "@/components/cards";
import { Reveal } from "@/components/ui";
import { TrendingListActions } from "../trending/actions";

export const dynamic = "force-dynamic";

export default async function MoviesPage() {
  const all = await getAll();
  const movies = all.filter((a) => a.type === "movie");
  const spotlight = movies[0];

  return (
    <div className="px-4 pb-16 pt-8 md:px-10 md:pt-10">
      <Reveal>
        <div className="mb-8 flex items-center gap-3">
          <span className="grid size-12 place-items-center rounded-2xl bg-violet/15 text-violet">
            <Clapperboard className="size-6" />
          </span>
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight md:text-3xl">Movies Night</h1>
            <p className="text-[12.5px] font-medium text-dim">
              {movies.length} films • Hindi dub • popcorn ready rakho 🍿
            </p>
          </div>
        </div>
      </Reveal>

      {spotlight && (
        <Reveal>
          <div className="group relative mb-10 overflow-hidden rounded-3xl border border-white/[0.07] shadow-card">
            <div className="relative h-[340px] md:h-[380px]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={spotlight.banner ?? spotlight.poster}
                alt={spotlight.title}
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
              />
              <div className="detail-scrim absolute inset-0" />
              <div
                className="pointer-events-none absolute -left-20 bottom-0 size-72 rounded-full opacity-30 blur-[100px]"
                style={{ background: spotlight.color ?? "#8b5cf6" }}
              />
              <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-6 p-6 md:p-8">
                <div className="max-w-xl">
                  <span className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-violet px-3 py-1 text-[10px] font-extrabold uppercase tracking-widest text-white">
                    <Popcorn className="size-3" /> Aaj ki pick
                  </span>
                  <h2 className="font-display text-3xl font-bold leading-tight text-white md:text-4xl">
                    {spotlight.title}
                  </h2>
                  <p className="mt-2 flex items-center gap-3 text-[12px] font-semibold text-white/70">
                    <span className="flex items-center gap-1 text-gold">
                      <Star className="size-3.5 fill-gold" /> {spotlight.score.toFixed(1)}
                    </span>
                    <span>{spotlight.year}</span>
                    <span>{spotlight.studio}</span>
                    <span className="rounded border border-white/25 px-1.5 text-[10px]">4K</span>
                  </p>
                  <p className="mt-3 line-clamp-2 text-[13px] leading-relaxed text-white/60">
                    {spotlight.synopsis}
                  </p>
                  <div className="mt-5 flex flex-wrap items-center gap-3">
                    <Link href={`/watch/${spotlight.id}/1`} className="btn-primary focus-ring flex items-center gap-2 rounded-full px-6 py-2.5 text-sm font-extrabold text-white">
                      <Play className="size-4 fill-white" /> Play Movie
                    </Link>
                    <Link href={`/anime/${spotlight.id}`} className="focus-ring glass flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold text-white transition hover:border-white/40">
                      <Info className="size-4" /> Details
                    </Link>
                  </div>
                </div>
                <img
                  src={spotlight.poster}
                  alt=""
                  className="hidden w-[150px] rotate-2 rounded-xl border border-white/20 shadow-card lg:block"
                />
              </div>
            </div>
          </div>
        </Reveal>
      )}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
        {movies.map((a, i) => (
          <Reveal key={a.id} delay={Math.min(i * 0.05, 0.35)}>
            <PosterCard a={a} className="w-full" />
            <div className="mt-2 flex items-center justify-between px-0.5">
              <span className="truncate text-[10.5px] font-bold uppercase tracking-wider text-dim">
                {a.studio}
              </span>
              <TrendingListActions id={a.id} title={a.title} />
            </div>
          </Reveal>
        ))}
      </div>
    </div>
  );
}