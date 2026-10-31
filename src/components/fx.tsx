import { motion } from "framer-motion";

export const EASE = [0.22, 1, 0.36, 1] as const;

/** letter-by-letter reveal (ported from reference R0) */
export function SplitLetters({
  text,
  delay = 0,
  className = "",
}: {
  text: string;
  delay?: number;
  className?: string;
}) {
  return (
    <span className={className}>
      {text.split("").map((c, i) => (
        <motion.span
          key={i}
          className="inline-block"
          initial={{ y: "110%", rotate: 8, opacity: 0 }}
          animate={{ y: 0, rotate: 0, opacity: 1 }}
          transition={{ delay: delay + i * 0.035, duration: 0.8, ease: EASE }}
        >
          {c === " " ? "\u00A0" : c}
        </motion.span>
      ))}
    </span>
  );
}

/** section heading: numbered oni chip + JP tag + giant Anton title */
export function SectionHead({
  num,
  chip,
  jp,
  title,
  titleAccent,
  desc,
  right,
}: {
  num: string;
  chip: string;
  jp: string;
  title: string;
  titleAccent?: string;
  desc?: string;
  right?: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.8 }}
      className="mb-12 flex flex-wrap items-end justify-between gap-8"
    >
      <div>
        <div className="mb-5 flex items-center gap-4">
          <span className="border border-oni/40 bg-oni/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.35em] text-oni">
            {num} — {chip}
          </span>
          <span className="font-jp text-xs font-bold text-ash">{jp}</span>
        </div>
        <h2 className="font-display text-4xl md:text-6xl uppercase leading-[0.9] text-paper">
          {title}
          {titleAccent && (
            <>
              {" "}
              <span className="text-stroke-oni">{titleAccent}</span>
            </>
          )}
        </h2>
        {desc && <p className="mt-4 max-w-md text-sm leading-relaxed text-paper/60">{desc}</p>}
      </div>
      {right}
    </motion.div>
  );
}
