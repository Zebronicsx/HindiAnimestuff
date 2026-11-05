"use client";

import { useRef, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { SectionHead } from "./ui";

export default function MediaRow({
  title,
  sub,
  href,
  children,
}: {
  title: string;
  sub?: string;
  href?: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const scroll = (dir: 1 | -1) => {
    const el = ref.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: "smooth" });
  };

  return (
    <section className="group/row relative">
      <SectionHead title={title} sub={sub} href={href} />
      <div className="relative">
        <div
          ref={ref}
          className="no-scrollbar flex snap-x gap-3.5 overflow-x-auto scroll-smooth px-1 pb-2 pt-1"
        >
          {children}
        </div>
        <button
          onClick={() => scroll(-1)}
          aria-label="Scroll left"
          className="focus-ring absolute -left-3 top-1/2 z-20 hidden size-10 -translate-y-1/2 place-items-center rounded-full border border-line bg-raised/95 text-fg opacity-0 shadow-card backdrop-blur transition hover:border-primary hover:text-primary-soft group-hover/row:opacity-100 md:grid"
        >
          <ChevronLeft className="size-5" />
        </button>
        <button
          onClick={() => scroll(1)}
          aria-label="Scroll right"
          className="focus-ring absolute -right-3 top-1/2 z-20 hidden size-10 -translate-y-1/2 place-items-center rounded-full border border-line bg-raised/95 text-fg opacity-0 shadow-card backdrop-blur transition hover:border-primary hover:text-primary-soft group-hover/row:opacity-100 md:grid"
        >
          <ChevronRight className="size-5" />
        </button>
        <div className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-ink to-transparent" />
      </div>
    </section>
  );
}