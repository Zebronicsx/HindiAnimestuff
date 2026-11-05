"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import type { ReactNode } from "react";

export function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 26 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

export function SectionHead({
  title,
  sub,
  href,
}: {
  title: string;
  sub?: string;
  href?: string;
}) {
  return (
    <div className="mb-4 flex items-end justify-between gap-4 px-1">
      <div>
        <div className="flex items-center gap-2.5">
          <span className="h-6 w-1 rounded-full bg-gradient-to-b from-primary to-violet shadow-glow" />
          <h2 className="font-display text-xl font-bold tracking-tight md:text-[22px]">{title}</h2>
        </div>
        {sub && <p className="mt-1 pl-3.5 text-xs font-medium text-dim">{sub}</p>}
      </div>
      {href && (
        <Link
          href={href}
          className="focus-ring group flex shrink-0 items-center gap-1.5 rounded-full border border-line bg-white/[0.03] px-3.5 py-1.5 text-xs font-bold text-mute transition hover:border-primary/50 hover:text-fg"
        >
          View more
          <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
        </Link>
      )}
    </div>
  );
}

export function EmptyState({
  title,
  sub,
  cta,
  href,
}: {
  title: string;
  sub: string;
  cta?: string;
  href?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-line bg-surface/40 px-6 py-14 text-center">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/img/mascot.png"
        alt="AnimesFreak mascot"
        className="mb-5 size-32 rounded-3xl object-cover opacity-90 shadow-card"
      />
      <h3 className="font-display text-lg font-bold">{title}</h3>
      <p className="mt-1.5 max-w-sm text-[13px] leading-relaxed text-mute">{sub}</p>
      {cta && href && (
        <Link
          href={href}
          className="btn-primary focus-ring mt-6 rounded-full px-6 py-2.5 text-sm font-bold text-white"
        >
          {cta}
        </Link>
      )}
    </div>
  );
}

export function GenrePill({ g, active = false }: { g: string; active?: boolean }) {
  return (
    <span
      className={`rounded-full px-3 py-1 text-[11px] font-semibold ${
        active
          ? "bg-primary text-white shadow-glow"
          : "border border-white/10 bg-white/[0.05] text-mute"
      }`}
    >
      {g}
    </span>
  );
}