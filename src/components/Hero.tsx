import { useMemo, useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Play, ChevronDown, Tv } from "lucide-react";
import { emblemImg as emblem, heroBgImg as heroBg } from "../assets/images";
import { AnimeItem } from "../lib/catalog";
import { href } from "../lib/router";
import { SplitLetters } from "./fx";

export default function Hero({ items, onRandom }: { items: AnimeItem[]; onRandom: () => void }) {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const bgY = useTransform(scrollYProgress, [0, 1], ["0%", "16%"]);
  const bgScale = useTransform(scrollYProgress, [0, 1], [1.05, 1.25]);
  const fade = useTransform(scrollYProgress, [0, 0.75], [1, 0]);

  const stats = useMemo(() => {
    const anime = items.filter((i) => i.category === "anime").length;
    const movies = items.filter((i) => i.category === "movies").length;
    const series = items.filter((i) => i.category === "series").length;
    return [
      [`${items.length}+`, "Titles in vault"],
      [`${anime}`, "Anime · Hindi dub"],
      [`${movies}`, "Movies"],
      [`${series}`, "Web series"],
    ];
  }, [items]);

  return (
    <section ref={ref} className="relative flex min-h-[100svh] flex-col overflow-hidden">
      <motion.div style={{ y: bgY, scale: bgScale }} className="absolute inset-0">
        <img src={heroBg} alt="" className="h-full w-full object-cover object-center" />
      </motion.div>
      <div className="absolute inset-0 bg-gradient-to-b from-ink/70 via-ink/55 to-ink" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(6,6,11,0.55)_72%)]" />

      {/* hairlines + side notes */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6, duration: 1 }} className="pointer-events-none absolute inset-y-0 left-5 hidden w-px bg-paper/10 md:block" />
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6, duration: 1 }} className="pointer-events-none absolute inset-y-0 right-5 hidden w-px bg-paper/10 md:block" />
      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8, duration: 1 }} className="jp-v pointer-events-none absolute left-9 top-1/2 hidden -translate-y-1/2 font-jp text-xs font-bold tracking-[0.6em] text-oni md:block">
        アニメフリーク — 狂気を解放せよ
      </motion.p>
      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8, duration: 1 }} className="pointer-events-none absolute right-9 top-1/2 hidden -translate-y-1/2 rotate-90 text-[10px] font-semibold uppercase tracking-[0.6em] text-ash md:block">
        ONI-01 / Signal Live
      </motion.p>

      <motion.div style={{ opacity: fade }} className="relative z-10 flex flex-1 flex-col items-center justify-center px-4 pb-14 pt-24 text-center sm:px-6 sm:pb-24 sm:pt-40">
        {/* emblem lockup */}
        <motion.div
          initial={{ scale: 0.4, opacity: 0, y: 30 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 1, ease: [0.22, 1, 0.36, 1] }}
          className="relative mb-7 sm:mb-10"
        >
          <div className="absolute -inset-10 animate-pulse-glow rounded-full bg-oni/25 blur-3xl" />
          <svg viewBox="0 0 200 200" className="absolute -inset-9 h-[calc(100%+72px)] w-[calc(100%+72px)] animate-spin-slow">
            <circle cx="100" cy="100" r="96" fill="none" stroke="rgba(255,42,42,0.35)" strokeWidth="1" strokeDasharray="4 14" />
            <circle cx="100" cy="4" r="2.5" fill="#ff2a2a" />
          </svg>
          <div className="relative animate-float">
            <div className="relative h-28 w-28 overflow-hidden rounded-[22px] border border-oni/40 shadow-[0_30px_80px_-16px_rgba(255,42,42,0.65)] sm:h-36 sm:w-36 sm:rounded-[28px] md:h-44 md:w-44">
              <img src={emblem} alt="AnimesFreak oni crest" className="h-full w-full object-cover" draggable={false} />
            </div>
            <div className="absolute -bottom-2.5 -right-2.5 grid h-9 w-9 place-items-center rounded-xl bg-oni text-white shadow-[0_6px_20px_rgba(255,42,42,0.7)]">
              <Play className="h-3.5 w-3.5 fill-current" />
            </div>
          </div>
        </motion.div>

        {/* network badge */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="mb-5 flex max-w-[92vw] items-center gap-2 border border-paper/15 bg-ink/40 px-3 py-1.5 text-[8px] font-semibold uppercase tracking-[0.28em] text-ash backdrop-blur-md sm:mb-6 sm:gap-3 sm:px-4 sm:py-2 sm:text-[10px] sm:tracking-[0.42em]"
        >
          <Tv className="h-3 w-3 shrink-0 text-oni sm:h-3.5 sm:w-3.5" />
          Anime OTT Network · Hindi Dub
        </motion.div>

        {/* giant title */}
        <h1 className="select-none font-display uppercase leading-[0.86] tracking-tight">
          <span className="app-title block max-w-full overflow-hidden text-paper md:text-[9.5rem]">
            <SplitLetters text="ANIMES" delay={0.55} />
          </span>
          <span
            className="glitch app-title block max-w-full overflow-hidden text-oni [text-shadow:0_0_50px_rgba(255,42,42,0.45)] md:text-[9.5rem]"
            data-text="FREAK"
          >
            <SplitLetters text="FREAK" delay={0.8} />
          </span>
        </h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.15, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="mt-5 max-w-xl text-balance px-1 text-[13px] leading-relaxed text-paper/70 sm:mt-7 sm:text-sm md:text-base"
        >
          Anime, movies and web series — <span className="text-spark">watch online</span> or{" "}
          <span className="text-oni">download directly</span>. Hindi dub, multi audio, from 480p to 1080p FHD.{" "}
          <span className="text-oni">Stream the madness.</span>
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.3, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="mt-7 flex w-full max-w-sm flex-col items-stretch justify-center gap-3 px-2 sm:mt-10 sm:max-w-none sm:flex-row sm:flex-wrap sm:gap-4 sm:px-0"
        >
          <a
            href={href("/anime")}
            data-hover
            className="slash-sweep group flex items-center justify-center gap-3 bg-oni px-6 py-3.5 text-[11px] font-bold uppercase tracking-[0.26em] text-white transition-colors hover:bg-oni-deep sm:px-8 sm:py-4 sm:text-xs sm:tracking-[0.3em] cut-corner"
          >
            <Play className="h-4 w-4 fill-current transition-transform group-hover:scale-125" />
            Start Watching
          </a>
          <button
            onClick={onRandom}
            data-hover
            className="flex items-center justify-center gap-3 border border-paper/25 bg-ink/30 px-6 py-3.5 text-[11px] font-bold uppercase tracking-[0.26em] text-paper backdrop-blur-md transition-all hover:border-oni hover:text-oni sm:px-8 sm:py-4 sm:text-xs sm:tracking-[0.3em]"
          >
            Random Freak Pick
            <ChevronDown className="h-4 w-4" />
          </button>
        </motion.div>
      </motion.div>

      {/* stat strip */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.6, duration: 1 }}
        className="relative z-10 mx-auto hidden w-full max-w-7xl grid-cols-4 gap-6 border-t border-paper/10 px-8 py-6 md:grid"
      >
        {stats.map(([v, l]) => (
          <div key={l} className="flex items-baseline gap-3">
            <span className="font-display text-2xl text-paper">{v}</span>
            <span className="text-[10px] uppercase tracking-[0.28em] text-ash">{l}</span>
          </div>
        ))}
      </motion.div>
    </section>
  );
}
