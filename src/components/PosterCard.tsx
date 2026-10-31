import { memo, useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";
import { Flame, Play, Plus, Star, Check } from "lucide-react";
import {
  AnimeItem,
  getMyList,
  onMyListChange,
  poster,
  toggleMyList,
  Progress,
} from "../lib/catalog";
import { href } from "../lib/router";

function useInList(id: string) {
  const [inList, setInList] = useState(() => getMyList().includes(id));
  useEffect(() => onMyListChange(() => setInList(getMyList().includes(id))), [id]);
  return [inList, () => setInList(toggleMyList(id))] as const;
}

const BADGE: Record<string, { label: string; cls: string }> = {
  anime: { label: "Anime", cls: "bg-oni text-white" },
  movies: { label: "Movie", cls: "bg-spark text-ink" },
  series: { label: "Series", cls: "bg-paper text-ink" },
};

const PosterCard = memo(function PosterCard({
  item,
  rank,
  progress,
  index = 0,
  fill = false,
}: {
  item: AnimeItem;
  rank?: number;
  progress?: Progress;
  index?: number;
  fill?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const rx = useMotionValue(0);
  const ry = useMotionValue(0);
  const srx = useSpring(rx, { stiffness: 180, damping: 16 });
  const sry = useSpring(ry, { stiffness: 180, damping: 16 });
  const [inList, toggle] = useInList(item.id);

  const onMove = (e: React.MouseEvent) => {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    ry.set(px * 12);
    rx.set(-py * 12);
  };
  const onLeave = () => {
    rx.set(0);
    ry.set(0);
  };

  const badge = BADGE[item.category] ?? BADGE.anime;

  const card = (
    <div className="[perspective:1000px]">
      <div
        ref={ref}
        onMouseMove={onMove}
        onMouseLeave={onLeave}
        data-hover
        className="group relative aspect-[2/3] overflow-hidden rounded-xl border border-line bg-panel transition-[border-color,box-shadow] duration-500 hover:border-oni/60 hover:shadow-[0_30px_80px_-24px_rgba(255,42,42,0.5)]"
      >
        <a href={href(`/title/${item.id}`)} className="absolute inset-0">
          <motion.div style={{ rotateX: srx, rotateY: sry }} className="absolute inset-0">
            <img
              src={poster(item, "w342")}
              alt={item.title}
              loading="lazy"
              draggable={false}
              className="h-full w-full scale-[1.06] object-cover transition-transform duration-700 group-hover:scale-[1.14]"
            />
          </motion.div>
          <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/25 to-transparent opacity-90 transition-opacity duration-500 group-hover:opacity-100" />
          <div className="absolute inset-0 bg-oni/0 mix-blend-overlay transition-colors duration-500 group-hover:bg-oni/20" />

          {/* badges */}
          <div className="absolute inset-x-3 top-3 flex items-start justify-between">
            <span className={`px-2.5 py-1.5 text-[9px] font-bold uppercase tracking-[0.22em] cut-corner-sm ${badge.cls}`}>
              {badge.label}
            </span>
            <span className="flex items-center gap-1.5 bg-ink/70 px-2.5 py-1.5 backdrop-blur-md">
              <Star className="h-3 w-3 fill-[#ffc22e] text-[#ffc22e]" />
              <span className="text-[11px] font-bold text-paper">{item.rating || "—"}</span>
            </span>
          </div>

          {/* center play */}
          <div className="absolute inset-0 grid place-items-center">
            <div className="grid h-14 w-14 scale-50 place-items-center rounded-full border border-paper/40 bg-ink/50 opacity-0 backdrop-blur-md transition-all duration-500 group-hover:scale-100 group-hover:opacity-100">
              <Play className="h-5 w-5 fill-paper text-paper" />
            </div>
          </div>

          {/* bottom meta */}
          <div className="absolute inset-x-0 bottom-0 p-4">
            <p className="font-jp text-[11px] font-bold tracking-[0.28em] text-oni">
              {item.season === "Movie" ? "映画" : item.season.replace("Season", "シーズン")} · {item.episode_tag || "HD"}
            </p>
            <h3 className="mt-1 font-display text-lg leading-none uppercase text-paper line-clamp-1">
              {item.title}
            </h3>
            <div className="mt-2.5 flex items-center justify-between gap-2">
              <span className="truncate text-[10px] font-semibold uppercase tracking-[0.2em] text-ash">
                {item.genres.slice(0, 2).join(" · ")}
              </span>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  toggle();
                }}
                aria-label="Toggle my list"
                className={`shrink-0 transition-colors ${inList ? "text-spark" : "text-ash group-hover:text-oni"}`}
              >
                {inList ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              </button>
            </div>
            {progress && progress.dur > 0 && (
              <div className="mt-2.5 h-[3px] bg-paper/15">
                <div
                  className="h-full bg-oni shadow-[0_0_8px_rgba(255,42,42,0.8)]"
                  style={{ width: `${Math.min(100, (progress.t / progress.dur) * 100)}%` }}
                />
              </div>
            )}
          </div>
        </a>
      </div>
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.7, delay: Math.min(index, 8) * 0.06, ease: [0.22, 1, 0.36, 1] }}
      className={
        fill
          ? "relative w-full"
          : "relative shrink-0 w-[150px] sm:w-[176px] lg:w-[200px] snap-start"
      }
    >
      {rank != null && (
        <span className="pointer-events-none absolute -left-2 -bottom-3 z-10 flex items-end gap-1 select-none">
          <span className="text-stroke font-display text-[64px] leading-[0.8]">{rank}</span>
          <Flame className="mb-1 h-4 w-4 fill-oni text-oni" />
        </span>
      )}
      {card}
    </motion.div>
  );
});

export default PosterCard;
