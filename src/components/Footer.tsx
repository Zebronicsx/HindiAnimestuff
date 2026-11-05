import Link from "next/link";
import { Play, Send, Code2, Heart } from "lucide-react";
import { TELEGRAM_URL } from "@/lib/types";

const COLS = [
  {
    h: "Explore",
    links: [
      { l: "Home", href: "/" },
      { l: "Trending", href: "/trending" },
      { l: "Discover", href: "/browse" },
      { l: "Movies", href: "/movies" },
    ],
  },
  {
    h: "Library",
    links: [
      { l: "My List", href: "/my-list" },
      { l: "History", href: "/history" },
      { l: "New Dub", href: "/browse?sort=newest" },
      { l: "Top Rated", href: "/browse?sort=rating" },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="relative mt-16 overflow-hidden border-t border-line/70 bg-surface/40">
      <div className="pointer-events-none absolute -top-24 left-1/3 h-48 w-96 rounded-full bg-primary/10 blur-[100px]" />
      <div className="relative grid gap-10 px-5 py-12 md:grid-cols-[1.4fr_1fr_1fr_1.2fr] md:px-10">
        <div>
          <Link href="/" className="flex items-center gap-2.5">
            <span className="btn-primary grid size-9 place-items-center rounded-xl">
              <Play className="size-4 fill-white text-white" />
            </span>
            <span className="font-display text-lg font-bold">
              Animes<span className="brand-grad">Freak</span>
            </span>
          </Link>
          <p className="font-hindi mt-3 text-[15px] font-semibold text-mute">
            स्ट्रीम करो, वो भी अपने अंदाज़ में। 🍿
          </p>
          <p className="mt-2 max-w-xs text-xs leading-relaxed text-dim">
            Hindi-dubbed anime ka ghar — trending series, movies aur daily episode updates, ek hi jagah.
          </p>
        </div>
        {COLS.map((c) => (
          <div key={c.h}>
            <h4 className="mb-3 text-[11px] font-extrabold uppercase tracking-[0.2em] text-dim">{c.h}</h4>
            <ul className="space-y-2">
              {c.links.map((x) => (
                <li key={x.l}>
                  <Link href={x.href} className="text-[13px] font-semibold text-mute transition hover:text-primary-soft">
                    {x.l}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
        <div>
          <h4 className="mb-3 text-[11px] font-extrabold uppercase tracking-[0.2em] text-dim">Community</h4>
          <a
            href={TELEGRAM_URL}
            target="_blank"
            rel="noreferrer"
            className="focus-ring flex w-fit items-center gap-2 rounded-full bg-cyanic/12 px-4 py-2 text-[12.5px] font-bold text-cyanic transition hover:bg-cyanic/25"
          >
            <Send className="size-3.5" /> @HindiAnimestuff
          </a>
          <a
            href="https://github.com/Zebronicsx/HindiAnimestuff"
            target="_blank"
            rel="noreferrer"
            className="mt-2.5 flex w-fit items-center gap-2 rounded-full bg-white/5 px-4 py-2 text-[12.5px] font-bold text-mute transition hover:text-fg"
          >
            <Code2 className="size-3.5" /> Source project
          </a>
          <p className="mt-4 text-[10.5px] leading-relaxed text-dim">
            Fan-made refresh inspired by Sora UI. Demo playback public sample videos use karta hai.
            Metadata &amp; art: AniList.
          </p>
        </div>
      </div>
      <div className="relative flex flex-col items-center justify-between gap-2 border-t border-line/60 px-5 py-5 text-[11px] font-semibold text-dim md:flex-row md:px-10">
        <span>© 2026 AnimesFreak • HindiAnimestuff</span>
        <span className="flex items-center gap-1.5">
          Made with <Heart className="size-3 fill-primary text-primary" /> for desi anime fans
        </span>
      </div>
      <p
        aria-hidden
        className="font-display pointer-events-none select-none whitespace-nowrap text-center text-[13vw] font-bold leading-[0.75] tracking-tight text-white/[0.025]"
      >
        ANIMESFREAK
      </p>
    </footer>
  );
}