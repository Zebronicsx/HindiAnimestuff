/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, Star, Mic2, MonitorPlay, Building2 } from "lucide-react";
import { getDetail } from "@/lib/data";
import MediaRow from "@/components/MediaRow";
import { PosterCard } from "@/components/cards";
import { Reveal } from "@/components/ui";
import DetailActions from "./DetailActions";
import DetailEpisodes from "./DetailEpisodes";

export const dynamic = "force-dynamic";

export default async function AnimePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getDetail(id);
  if (!data) notFound();
  const { anime: a, episodes, related } = data;

  return (
    <>
      {/* backdrop */}
      <div className="relative h-[380px] md:h-[440px]">
        <img
          src={a.banner ?? a.poster}
          alt=""
          className="absolute inset-0 h-full w-full object-cover object-center"
        />
        <img
          src={a.banner ?? a.poster}
          alt=""
          aria-hidden
          className="absolute inset-0 h-full w-full scale-125 object-cover opacity-30 blur-3xl"
        />
        <div className="detail-scrim absolute inset-0" />
        <div
          className="pointer-events-none absolute -left-24 top-1/4 size-96 rounded-full opacity-25 blur-[120px]"
          style={{ background: a.color ?? "#f31260" }}
        />
        <Link
          href="/browse"
          className="focus-ring glass absolute left-4 top-5 z-10 flex items-center gap-1.5 rounded-full px-4 py-2 text-[12px] font-bold text-white/80 transition hover:text-white md:left-10"
        >
          <ChevronLeft className="size-4" /> Discover
        </Link>
      </div>

      <div className="relative z-10 -mt-52 px-4 md:-mt-56 md:px-10">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end">
          <Reveal className="shrink-0">
            <img
              src={a.poster}
              alt={a.title}
              className="w-[168px] rounded-2xl border border-white/15 shadow-card md:w-[205px]"
            />
          </Reveal>
          <div className="min-w-0 flex-1 pb-1">
            <Reveal delay={0.05}>
              <div className="mb-2.5 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-primary px-3 py-1 text-[10px] font-extrabold uppercase tracking-widest text-white shadow-glow">
                  {a.type === "movie" ? "Movie" : "Series"}
                </span>
                <span className="flex items-center gap-1.5 rounded-full border border-cyanic/40 bg-cyanic/10 px-3 py-1 text-[10px] font-extrabold uppercase tracking-widest text-cyanic">
                  <Mic2 className="size-3" /> {a.languages.join(" • ")}
                </span>
                {a.isNew && (
                  <span className="rounded-full bg-mint/15 px-3 py-1 text-[10px] font-extrabold uppercase tracking-widest text-mint">
                    Fresh Dub
                  </span>
                )}
              </div>
              <h1 className="font-display text-3xl font-bold leading-[1.05] tracking-tight md:text-5xl">
                {a.title}
              </h1>
              <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-dim">
                {a.romaji}
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 text-[12.5px] font-semibold text-mute">
                <span className="flex items-center gap-1 rounded-md bg-gold/15 px-2 py-0.5 font-bold text-gold">
                  <Star className="size-3.5 fill-gold" /> {a.score.toFixed(1)}
                </span>
                <span>{a.year}</span>
                <span className="size-1 rounded-full bg-line" />
                <span>{a.type === "movie" ? "Full Movie" : `${a.episodesCount} Episodes`}</span>
                <span className="size-1 rounded-full bg-line" />
                <span className="flex items-center gap-1"><Building2 className="size-3.5 text-dim" /> {a.studio}</span>
                <span className="flex items-center gap-1.5">
                  {a.qualities.map((ql) => (
                    <span key={ql} className="rounded border border-line px-1.5 py-px text-[10px] font-bold text-cyanic">
                      {ql}
                    </span>
                  ))}
                </span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {a.genres.map((g) => (
                  <Link
                    key={g}
                    href={`/browse?genre=${encodeURIComponent(g)}`}
                    className="focus-ring rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-[11px] font-semibold text-mute transition hover:border-primary/50 hover:text-fg"
                  >
                    {g}
                  </Link>
                ))}
              </div>
            </Reveal>
          </div>
        </div>

        <Reveal delay={0.1}>
          <p className="mt-6 max-w-3xl text-[13.5px] leading-relaxed text-mute">{a.synopsis}</p>
          <DetailActions anime={a} />
        </Reveal>

        <Reveal delay={0.12}>
          <div className="mt-8 grid max-w-3xl grid-cols-3 gap-3">
            {[
              { icon: MonitorPlay, l: "Video", v: a.qualities[a.qualities.length - 1] + " • MP4" },
              { icon: Mic2, l: "Audio", v: "Hindi + Japanese" },
              { icon: Star, l: "Rating", v: `${a.score.toFixed(1)} / 10` },
            ].map((s) => (
              <div key={s.l} className="rounded-2xl border border-line bg-surface/60 p-3.5">
                <s.icon className="mb-2 size-4 text-primary-soft" />
                <p className="text-[10px] font-bold uppercase tracking-widest text-dim">{s.l}</p>
                <p className="mt-0.5 truncate text-[12.5px] font-bold text-fg">{s.v}</p>
              </div>
            ))}
          </div>
        </Reveal>

        <div className="mt-12">
          <DetailEpisodes anime={a} episodes={episodes} />
        </div>

        {related.length > 0 && (
          <div className="mt-14">
            <Reveal>
              <MediaRow title="Aur Bhi Dekho" sub="Same vibe, same masti" href="/browse">
                {related.map((r) => (
                  <PosterCard key={r.id} a={r} />
                ))}
              </MediaRow>
            </Reveal>
          </div>
        )}
        <div className="pb-10" />
      </div>
    </>
  );
}