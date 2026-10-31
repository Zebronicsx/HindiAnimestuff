import { motion } from "framer-motion";
import { ArrowUpRight, Gamepad2, MessageCircle, Rss, Tv } from "lucide-react";
import Logo from "./Logo";
import { href } from "../lib/router";

const COLS = [
  {
    title: "The Vault",
    links: [
      ["Anime · Hindi Dub", "/anime"],
      ["Movies", "/movies"],
      ["Web Series", "/series"],
      ["My List", "/mylist"],
    ],
  },
  {
    title: "Formats",
    links: [
      ["1080p FHD · x265", "/anime"],
      ["720p HD · x264", "/movies"],
      ["480p · WEB-DL", "/series"],
      ["Multi Audio + ESub", "/anime"],
    ],
  },
  {
    title: "Signal",
    links: [
      ["Watch Online", "/anime"],
      ["Direct Download", "/movies"],
      ["Romance & Fantasy", "/series"],
      ["Action Overdose", "/anime"],
    ],
  },
];

const SOCIAL = [
  { icon: Tv, label: "Freak TV" },
  { icon: MessageCircle, label: "Community" },
  { icon: Gamepad2, label: "Arcade" },
  { icon: Rss, label: "Signal Feed" },
];

export default function Footer() {
  return (
    <footer className="relative overflow-hidden border-t border-line bg-coal">
      <div className="mx-auto max-w-7xl px-5 pb-10 pt-20 md:px-8">
        <div className="grid gap-14 lg:grid-cols-[1.2fr_2fr]">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <Logo showTag />
            <p className="mt-6 max-w-xs text-sm leading-relaxed text-paper/55">
              The anime OTT network for the obsessed — Hindi dub and multi audio. Watch online or download directly,{" "}
              <span className="text-oni">the chaos stream</span> is always live.
            </p>
            <div className="mt-7 flex gap-3">
              {SOCIAL.map((s) => (
                <a
                  key={s.label}
                  href={href("/")}
                  aria-label={s.label}
                  data-hover
                  className="grid h-10 w-10 place-items-center rounded-lg border border-line text-ash transition-all duration-300 hover:-translate-y-1 hover:border-oni hover:text-oni"
                >
                  <s.icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </motion.div>

          <div className="grid grid-cols-2 gap-10 sm:grid-cols-3">
            {COLS.map((col, i) => (
              <motion.div
                key={col.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, delay: i * 0.08 }}
              >
                <h4 className="text-[10px] font-bold uppercase tracking-[0.35em] text-oni">{col.title}</h4>
                <ul className="mt-5 space-y-3.5">
                  {col.links.map(([label, to]) => (
                    <li key={label}>
                      <a
                        href={href(to)}
                        data-hover
                        className="group inline-flex items-center gap-1.5 text-sm text-paper/60 transition-colors hover:text-paper"
                      >
                        {label}
                        <ArrowUpRight className="h-3 w-3 opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100 group-hover:text-oni" />
                      </a>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="pointer-events-none mt-16 select-none overflow-hidden border-t border-line pt-10">
          <p className="glitch whitespace-nowrap text-center font-display text-[12vw] uppercase leading-[0.85] text-stroke" data-text="ANIMESFREAK">
            ANIMESFREAK
          </p>
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-line pt-6 text-[10px] font-semibold uppercase tracking-[0.28em] text-ash">
          <span>© {new Date().getFullYear()} AnimesFreak Network</span>
          <span className="font-jp tracking-[0.4em] text-oni">狂気をストリーミングせよ</span>
          <span>ONI-01 / All signals live</span>
        </div>
      </div>
    </footer>
  );
}
