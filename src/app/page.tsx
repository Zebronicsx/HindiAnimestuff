import Link from "next/link";
import { Zap } from "lucide-react";
import { getAll, byFeatured, byTrending, byNewest } from "@/lib/data";
import { ALL_GENRES } from "@/lib/catalog";
import Hero from "@/components/Hero";
import MediaRow from "@/components/MediaRow";
import ContinueRow from "@/components/ContinueRow";
import { PosterCard, RankCard } from "@/components/cards";
import { Reveal, SectionHead } from "@/components/ui";

const MARQUEE = [
  "हिंदी DUB", "4K QUALITY", "NO ADS", "DAILY UPDATES", "SAB FREE", "MULTI AUDIO", "हिंदी DUB", "4K QUALITY", "NO ADS", "DAILY UPDATES", "SAB FREE", "MULTI AUDIO",
];

export default async function HomePage() {
  const all = await getAll();
  const featured = byFeatured(all);
  const trending = byTrending(all).slice(0, 10);
  const latest = byNewest(all).slice(0, 14);
  const popular = all.slice(0, 16);
  const movies = all.filter((a) => a.type === "movie");

  return (
    <>
      <Hero items={featured.length ? featured : all.slice(0, 5)} />

      <div className="space-y-12 px-4 pb-10 pt-8 md:px-10">
        <ContinueRow />

        <Reveal>
          <MediaRow title="Trending Now" sub="India mein sabse zyada dekha ja raha hai" href="/trending">
            {trending.map((a, i) => (
              <RankCard key={a.id} a={a} rank={i + 1} />
            ))}
          </MediaRow>
        </Reveal>

        {/* tilted marquee strip */}
        <Reveal>
          <div className="relative -mx-4 -rotate-1 overflow-hidden border-y border-primary/30 bg-gradient-to-r from-primary/15 via-violet/10 to-primary/15 py-3 md:-mx-10">
            <div className="marquee-track flex w-max items-center gap-8">
              {[...MARQUEE, ...MARQUEE].map((m, i) => (
                <span key={i} className="flex items-center gap-8 whitespace-nowrap">
                  <span className={`text-sm font-extrabold tracking-[0.2em] ${m.includes("हिंदी") ? "font-hindi text-primary-soft tracking-normal text-base" : "text-white/60"}`}>
                    {m}
                  </span>
                  <Zap className="size-3.5 fill-primary text-primary" />
                </span>
              ))}
            </div>
          </div>
        </Reveal>

        <Reveal>
          <MediaRow title="Fresh Hindi Dubs" sub="Abhi-abhi add hue episodes aur titles" href="/browse?sort=newest">
            {latest.map((a) => (
              <PosterCard key={a.id} a={a} />
            ))}
          </MediaRow>
        </Reveal>

        <Reveal>
          <MediaRow title="Sabse Popular" sub="All-time highest rated — critic-proof classics" href="/browse?sort=rating">
            {popular.map((a) => (
              <PosterCard key={a.id} a={a} />
            ))}
          </MediaRow>
        </Reveal>

        <Reveal>
          <MediaRow title="Movies Night" sub="Ek shaam, ek film — Hindi mein" href="/movies">
            {movies.map((a) => (
              <PosterCard key={a.id} a={a} />
            ))}
          </MediaRow>
        </Reveal>

        <Reveal>
          <section>
            <SectionHead title="Mood Kya Hai?" sub="Genre se dhoondo apna agla obsession" />
            <div className="flex flex-wrap gap-2.5 px-1">
              {ALL_GENRES.map((g) => (
                <Link
                  key={g}
                  href={`/browse?genre=${encodeURIComponent(g)}`}
                  className="focus-ring rounded-full border border-line bg-white/[0.03] px-4 py-2 text-[12.5px] font-bold text-mute transition hover:border-primary/60 hover:bg-primary/10 hover:text-fg"
                >
                  {g}
                </Link>
              ))}
            </div>
          </section>
        </Reveal>
      </div>
    </>
  );
}