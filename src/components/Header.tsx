import { useEffect, useState } from "react";
import { motion, useScroll } from "framer-motion";
import { Radio, Search } from "lucide-react";
import Logo from "./Logo";
import { href, Route } from "../lib/router";

const LINKS = [
  { label: "Home", jp: "ホーム", to: "/" },
  { label: "Anime", jp: "アニメ", to: "/anime" },
  { label: "Movies", jp: "映画", to: "/movies" },
  { label: "Series", jp: "シリーズ", to: "/series" },
  { label: "My List", jp: "保存", to: "/mylist" },
];

export default function Header({ route, onSearch, count }: { route: Route; onSearch: () => void; count?: number }) {
  const { scrollY, scrollYProgress } = useScroll();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => scrollY.on("change", (v) => setScrolled(v > 40)), [scrollY]);

  const active = "/" + (route.seg[0] ?? "");

  return (
    <>
      {/* top red progress bar */}
      <motion.div
        style={{ scaleX: scrollYProgress }}
        className="fixed inset-x-0 top-0 z-[85] h-[3px] origin-left bg-oni shadow-[0_0_12px_rgba(255,42,42,0.8)]"
      />
      <motion.header
        initial={{ y: -90, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.15, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className={`fixed inset-x-0 top-0 z-[80] transition-all duration-500 ${
          scrolled
            ? "border-b border-line/80 bg-ink/80 backdrop-blur-xl"
            : "border-b border-transparent bg-transparent"
        }`}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 md:h-20 md:px-8">
          <a href={href("/")} data-hover aria-label="AnimesFreak home">
            <Logo />
          </a>

          <nav className="hidden items-center gap-8 lg:flex">
            {LINKS.map((l) => {
              const isActive = l.to === "/" ? route.seg.length === 0 : active.startsWith(l.to);
              return (
                <a
                  key={l.to}
                  href={href(l.to)}
                  data-hover
                  className={`group relative text-[11px] font-semibold uppercase tracking-[0.3em] transition-colors ${
                    isActive ? "text-paper" : "text-ash hover:text-paper"
                  }`}
                >
                  {l.label}
                  <span className="ml-2 font-jp text-[10px] text-oni/80">{l.jp}</span>
                  <span
                    className={`absolute -bottom-2 left-0 h-px bg-oni transition-all duration-300 ${
                      isActive ? "w-full" : "w-0 group-hover:w-full"
                    }`}
                  />
                </a>
              );
            })}
          </nav>

          <div className="flex items-center gap-3">
            <span className="hidden xl:flex items-center gap-2 border border-line px-3 py-1.5 text-[9px] font-bold uppercase tracking-[0.3em] text-ash">
              <span className="h-1.5 w-1.5 rounded-full bg-spark animate-pulse" />
              {count ? `${count.toLocaleString("en-US")} titles` : "1,715 titles"} — Signal Live
            </span>
            <button
              onClick={onSearch}
              data-hover
              className="slash-sweep group flex items-center gap-2.5 bg-oni px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.25em] text-white transition-colors hover:bg-oni-deep md:px-6 md:py-3 cut-corner-sm"
            >
              <Search className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Cruise Vault</span>
            </button>
          </div>
        </div>

        {/* mobile nav strip */}
        <nav className="flex lg:hidden items-center gap-5 overflow-x-auto no-scrollbar border-t border-line/60 bg-ink/85 px-5 py-2.5 backdrop-blur-xl">
          <Radio className="h-3.5 w-3.5 shrink-0 text-oni animate-pulse" />
          {LINKS.map((l) => {
            const isActive = l.to === "/" ? route.seg.length === 0 : active.startsWith(l.to);
            return (
              <a
                key={l.to}
                href={href(l.to)}
                className={`whitespace-nowrap text-[10px] font-bold uppercase tracking-[0.24em] transition-colors ${
                  isActive ? "text-oni" : "text-ash"
                }`}
              >
                {l.label}
              </a>
            );
          })}
        </nav>
      </motion.header>
    </>
  );
}
