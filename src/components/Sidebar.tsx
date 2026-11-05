"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Home, Flame, Compass, Clapperboard, BookmarkCheck, History,
  Search, Menu, X, Send, Play,
} from "lucide-react";
import { useUI, useLibrary } from "./providers";
import { TELEGRAM_URL } from "@/lib/types";

const NAV = [
  { href: "/", label: "Home", icon: Home },
  { href: "/trending", label: "Trending", icon: Flame },
  { href: "/browse", label: "Discover", icon: Compass },
  { href: "/movies", label: "Movies", icon: Clapperboard },
];
const LIB = [
  { href: "/my-list", label: "My List", icon: BookmarkCheck },
  { href: "/history", label: "History", icon: History },
];

function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className="focus-ring group flex items-center gap-2.5 rounded-xl">
      <span className="btn-primary grid size-9 shrink-0 place-items-center rounded-xl">
        <Play className="size-4 fill-white text-white" />
      </span>
      {!compact && (
        <span className="leading-none">
          <span className="font-display text-[19px] font-bold tracking-tight">
            Animes<span className="brand-grad">Freak</span>
          </span>
          <span className="mt-1 block text-[8.5px] font-bold uppercase tracking-[0.28em] text-dim">
            Hindi Anime Stuff
          </span>
        </span>
      )}
    </Link>
  );
}

function NavItems({
  onNavigate,
  rail = false,
  full = false,
}: {
  onNavigate?: () => void;
  rail?: boolean;
  full?: boolean;
}) {
  const pathname = usePathname();
  const { setSearchOpen } = useUI();
  const { ids } = useLibrary();

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    if (href === "/browse")
      return (
        pathname.startsWith("/browse") ||
        pathname.startsWith("/anime") ||
        pathname.startsWith("/watch")
      );
    return pathname.startsWith(href);
  };

  const lbl = full ? "inline" : "hidden lg:inline";
  const item = (active: boolean) =>
    `focus-ring group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13.5px] font-semibold transition-all ${
      active ? "bg-white/[0.07] text-fg" : "text-mute hover:bg-white/[0.04] hover:text-fg"
    } ${rail ? "justify-center px-0" : ""}`;

  const dot = (
    <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-primary shadow-glow" />
  );

  return (
    <nav className="flex flex-col gap-1">
      {NAV.map((n) => {
        const active = isActive(n.href);
        return (
          <Link key={n.href} href={n.href} onClick={onNavigate} className={item(active)} title={n.label}>
            {active && dot}
            <n.icon className={`size-[18px] shrink-0 ${active ? "text-primary-soft" : "text-dim group-hover:text-mute"}`} />
            {!rail && <span className={lbl}>{n.label}</span>}
          </Link>
        );
      })}
      <button onClick={() => { setSearchOpen(true); onNavigate?.(); }} className={`${item(false)} w-full`} title="Search">
        <Search className="size-[18px] shrink-0 text-dim group-hover:text-mute" />
        {!rail && (
          <>
            <span className={`flex-1 text-left ${lbl}`}>Search</span>
            <kbd className={`rounded-md border border-line bg-ink px-1.5 py-0.5 text-[10px] font-bold text-dim ${full ? "inline" : "hidden lg:inline"}`}>
              ⌘K
            </kbd>
          </>
        )}
      </button>

      {!rail && (
        <p className={`mt-5 mb-1 px-3 text-[10px] font-bold uppercase tracking-[0.22em] text-dim ${full ? "block" : "hidden lg:block"}`}>
          Library
        </p>
      )}
      {rail && <div className="mx-3 my-3 border-t border-line" />}
      {LIB.map((n) => {
        const active = isActive(n.href);
        return (
          <Link key={n.href} href={n.href} onClick={onNavigate} className={item(active)} title={n.label}>
            {active && dot}
            <n.icon className={`size-[18px] shrink-0 ${active ? "text-primary-soft" : "text-dim group-hover:text-mute"}`} />
            {!rail && <span className={`flex-1 ${lbl}`}>{n.label}</span>}
            {!rail && n.href === "/my-list" && ids.size > 0 && (
              <span className={`rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-bold text-primary-soft ${full ? "inline" : "hidden lg:inline"}`}>
                {ids.size}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}

function TelegramCard() {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-primary/25 bg-gradient-to-br from-primary/15 via-surface to-violet/10 p-4">
      <div className="pointer-events-none absolute -right-6 -top-6 size-20 rounded-full bg-primary/20 blur-2xl" />
      <p className="font-hindi text-[15px] font-bold leading-tight text-fg">
        सब कुछ हिंदी में! <span className="align-middle">🔥</span>
      </p>
      <p className="mt-1 text-[11px] leading-snug text-mute">
        Naye episodes aur downloads sabse pehle Telegram par.
      </p>
      <a
        href={TELEGRAM_URL}
        target="_blank"
        rel="noreferrer"
        className="focus-ring mt-3 flex items-center justify-center gap-1.5 rounded-full bg-cyanic/15 py-2 text-[12px] font-bold text-cyanic transition hover:bg-cyanic/25"
      >
        <Send className="size-3.5" /> @HindiAnimestuff
      </a>
    </div>
  );
}

export default function Sidebar() {
  const [open, setOpen] = useState(false);
  const { setSearchOpen } = useUI();
  const pathname = usePathname();

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <>
      {/* desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[76px] flex-col border-r border-line/70 bg-surface/60 px-3 py-5 backdrop-blur-xl md:flex lg:w-[236px] lg:px-4">
        <div className="mb-7 hidden lg:block"><Brand /></div>
        <div className="mb-7 flex justify-center lg:hidden"><Brand compact /></div>
        <div className="hidden flex-1 lg:block"><NavItems /></div>
        <div className="flex-1 lg:hidden"><NavItems rail /></div>
        <div className="hidden lg:block"><TelegramCard /></div>
        <a
          href={TELEGRAM_URL}
          target="_blank"
          rel="noreferrer"
          title="Join Telegram"
          className="focus-ring mx-auto grid size-10 place-items-center rounded-xl bg-cyanic/10 text-cyanic transition hover:bg-cyanic/20 lg:hidden"
        >
          <Send className="size-4" />
        </a>
        <p className="mt-4 hidden text-center text-[9.5px] font-medium tracking-wide text-dim lg:block">
          v2.0 • Sora-style refresh ✦
        </p>
      </aside>

      {/* mobile top bar */}
      <header className="glass fixed inset-x-0 top-0 z-40 flex h-14 items-center justify-between px-4 md:hidden">
        <Brand />
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setSearchOpen(true)}
            aria-label="Search"
            className="focus-ring grid size-9 place-items-center rounded-xl text-mute transition hover:bg-white/5 hover:text-fg"
          >
            <Search className="size-[18px]" />
          </button>
          <button
            onClick={() => setOpen(true)}
            aria-label="Menu"
            className="focus-ring grid size-9 place-items-center rounded-xl text-mute transition hover:bg-white/5 hover:text-fg"
          >
            <Menu className="size-5" />
          </button>
        </div>
      </header>

      {/* mobile drawer */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm md:hidden"
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 380, damping: 36 }}
              className="fixed inset-y-0 left-0 z-50 flex w-[280px] flex-col border-r border-line bg-surface px-5 py-5 md:hidden"
            >
              <div className="mb-7 flex items-center justify-between">
                <Brand />
                <button
                  onClick={() => setOpen(false)}
                  aria-label="Close menu"
                  className="focus-ring grid size-9 place-items-center rounded-xl text-mute hover:bg-white/5"
                >
                  <X className="size-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto"><NavItems full onNavigate={() => setOpen(false)} /></div>
              <TelegramCard />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}