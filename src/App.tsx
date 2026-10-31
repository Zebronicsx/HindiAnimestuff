import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Zap } from "lucide-react";
import Lenis from "lenis";
import { AnimeItem, getById, loadCatalog, preferredQuality, qualitiesFor } from "./lib/catalog";
import { href, useHashRoute } from "./lib/router";
import Header from "./components/Header";
import Loader from "./components/Loader";
import Cursor from "./components/Cursor";
import SearchOverlay from "./components/SearchOverlay";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import Browse from "./pages/Browse";
import Detail from "./pages/Detail";
import Watch from "./pages/Watch";
import MyList from "./pages/MyList";

export default function App() {
  const [items, setItems] = useState<AnimeItem[] | null>(null);
  const [error, setError] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [booted, setBooted] = useState(false);
  const route = useHashRoute();

  useEffect(() => {
    loadCatalog()
      .then((catalog) => {
        setItems(catalog);
        document.documentElement.dataset.afApp = "ready";
        window.clearTimeout(window.__AF_WATCHDOG__);
      })
      .catch(() => {
        document.documentElement.dataset.afApp = "error";
        setError(true);
      });
  }, []);

  // lenis smooth scroll
  useEffect(() => {
    const lenis = new Lenis({ duration: 1.15, smoothWheel: true });
    let raf = 0;
    const loop = (t: number) => {
      lenis.raf(t);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      lenis.destroy();
    };
  }, []);

  // "/" opens search
  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      if (e.key === "/" && !searchOpen) {
        const tag = (e.target as HTMLElement)?.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA") return;
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [searchOpen]);

  const isWatch = route.seg[0] === "watch";

  // close search on route change
  useEffect(() => setSearchOpen(false), [route.raw]);

  const page = useMemo(() => {
    if (!items) return null;
    const [s0, s1, s2, s3] = route.seg;

    if (s0 === "anime" || s0 === "movies" || s0 === "series")
      return <Browse items={items} category={s0} />;

    if (s0 === "mylist") return <MyList />;

    if (s0 === "title" && s1) {
      const item = getById(s1);
      if (!item) return <NotFound />;
      return <Detail item={item} allItems={items} tab={s2 === "download" ? "download" : "watch"} />;
    }

    if (s0 === "watch" && s1) {
      const item = getById(s1);
      if (!item) return <NotFound />;
      {
        const episode = s2 || "movie";
        const available = qualitiesFor(item, episode === "movie" ? undefined : episode);
        const requested = available.find((x) => x.q === s3);
        return <Watch item={item} ep={episode} q={requested?.q ?? preferredQuality(item, episode === "movie" ? undefined : episode)} />;
      }
    }

    return <Home items={items} />;
  }, [items, route]);

  return (
    <div className="grain scanlines relative min-h-screen bg-ink text-paper">
      <Cursor />
      <Toaster />
      <AnimatePresence>
        {!booted && !error && <Loader ready={!!items} />}
      </AnimatePresence>
      {items && !booted && <BootTimer onDone={() => setBooted(true)} />}

      {error && (
        <div className="grid min-h-screen place-items-center bg-ink px-6 text-center">
          <div>
            <p className="font-display text-4xl uppercase text-paper">Signal lost</p>
            <p className="mt-3 text-sm text-ash">Could not connect to the vault. Check your connection and try again.</p>
            <button
              onClick={() => window.location.reload()}
              data-hover
              className="slash-sweep mt-8 bg-oni px-8 py-4 text-xs font-bold uppercase tracking-[0.3em] text-white cut-corner"
            >
              Retry Signal
            </button>
          </div>
        </div>
      )}

      {items && (
        <>
          {!isWatch && <Header route={route} onSearch={() => setSearchOpen(true)} count={items.length} />}
          <main className="pb-[68px] lg:pb-0">{page}</main>
          {!isWatch && <Footer />}
          <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} items={items} />
        </>
      )}
    </div>
  );
}

/** global feedback toasts for downloads / copies / player actions */
function Toaster() {
  const [msg, setMsg] = useState<string | null>(null);
  useEffect(() => {
    let t = 0;
    const on = (e: Event) => {
      setMsg((e as CustomEvent<string>).detail);
      window.clearTimeout(t);
      t = window.setTimeout(() => setMsg(null), 5200);
    };
    window.addEventListener("af-toast", on);
    return () => {
      window.removeEventListener("af-toast", on);
      window.clearTimeout(t);
    };
  }, []);

  return (
    <AnimatePresence>
      {msg && (
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          className="fixed bottom-6 left-1/2 z-[210] flex max-w-[92vw] -translate-x-1/2 items-start gap-3 border border-oni/50 bg-coal/95 px-5 py-3.5 shadow-[0_20px_60px_-15px_rgba(255,42,42,0.6)] backdrop-blur-xl"
        >
          <Zap className="mt-0.5 h-4 w-4 shrink-0 fill-oni text-oni" />
          <p className="text-[12.5px] font-medium leading-snug text-paper/85">{msg}</p>
          <button onClick={() => setMsg(null)} aria-label="Dismiss" className="ml-1 shrink-0 text-ash hover:text-paper">
            ×
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** Briefly keeps the loader visible after local catalog decoding. */
function BootTimer({ onDone }: { onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 1400);
    return () => clearTimeout(t);
  }, [onDone]);
  return null;
}

function NotFound() {
  return (
    <div className="grid min-h-screen place-items-center px-6 pt-20 text-center">
      <div>
        <p className="glitch font-display text-[20vw] leading-none text-stroke-oni md:text-[10rem]" data-text="404">
          404
        </p>
        <p className="mt-4 font-jp text-sm font-bold tracking-[0.4em] text-oni">信号なし</p>
        <p className="mt-2 text-sm text-ash">This page is not in the vault.</p>
        <a
          href={href("/")}
          data-hover
          className="slash-sweep mt-8 inline-block bg-oni px-8 py-4 text-xs font-bold uppercase tracking-[0.3em] text-white transition-colors hover:bg-oni-deep cut-corner"
        >
          Back to Home
        </a>
      </div>
    </div>
  );
}
