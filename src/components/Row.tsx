import { useRef, useState, ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function Row({
  num,
  chip,
  jp,
  title,
  accent,
  viewAll,
  children,
}: {
  num: string;
  chip: string;
  jp: string;
  title: string;
  accent?: string;
  viewAll?: string;
  children: ReactNode;
}) {
  const track = useRef<HTMLDivElement>(null);
  const [canL, setCanL] = useState(false);
  const [canR, setCanR] = useState(true);

  const update = () => {
    const el = track.current;
    if (!el) return;
    setCanL(el.scrollLeft > 20);
    setCanR(el.scrollLeft < el.scrollWidth - el.clientWidth - 20);
  };

  const scroll = (dir: number) =>
    track.current?.scrollBy({ left: dir * track.current.clientWidth * 0.8, behavior: "smooth" });

  return (
    <section className="relative py-7 md:py-14">
      <div className="mx-auto mb-5 flex max-w-7xl flex-wrap items-end justify-between gap-3 px-4 sm:px-5 md:mb-7 md:px-8">
        <div>
          <div className="mb-3 flex flex-wrap items-center gap-2 sm:mb-4 sm:gap-4">
            <span className="border border-oni/40 bg-oni/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.35em] text-oni">
              {num} — {chip}
            </span>
            <span className="font-jp text-xs font-bold text-ash">{jp}</span>
          </div>
          <h2 className="font-display text-2xl uppercase leading-[0.9] text-paper sm:text-3xl md:text-5xl">
            {title} {accent && <span className="text-oni">{accent}</span>}
          </h2>
        </div>
        <div className="flex items-center gap-2.5">
          {viewAll && (
            <a
              href={viewAll}
              data-hover
              className="group mr-2 hidden sm:flex items-center gap-3 border border-line px-5 py-3 text-[10px] font-bold uppercase tracking-[0.28em] text-paper transition-all hover:border-oni hover:text-oni"
            >
              Full vault
              <span className="transition-transform duration-300 group-hover:translate-x-1.5">→</span>
            </a>
          )}
          <button
            onClick={() => scroll(-1)}
            disabled={!canL}
            data-hover
            aria-label="Scroll left"
            className="hidden h-10 w-10 place-items-center border border-line text-ash sm:grid transition-all hover:border-oni hover:text-oni disabled:opacity-25 disabled:hover:border-line disabled:hover:text-ash"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => scroll(1)}
            disabled={!canR}
            data-hover
            aria-label="Scroll right"
            className="hidden h-10 w-10 place-items-center border border-line text-ash sm:grid transition-all hover:border-oni hover:text-oni disabled:opacity-25 disabled:hover:border-line disabled:hover:text-ash"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div className="mx-auto max-w-7xl px-4 sm:px-5 md:px-8">
        <div
          ref={track}
          onScroll={update}
          className="no-scrollbar row-track flex snap-x gap-3 overflow-x-auto pb-3 sm:gap-4 md:gap-5"
        >
          {children}
        </div>
      </div>
    </section>
  );
}
