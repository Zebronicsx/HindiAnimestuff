import { useEffect, useMemo, useState } from "react";
import { ChevronDown, Flame, Languages, Shapes } from "lucide-react";
import PosterCard from "../components/PosterCard";
import { AnimeItem, ratingOf } from "../lib/catalog";

const PAGE = 48;

const META: Record<string, { chip: string; jp: string; title: string; accent: string; desc: string; kanji: string }> = {
  anime: {
    chip: "Vault — Anime",
    jp: "アニメ保管庫",
    title: "Anime",
    accent: "Vault",
    kanji: "アニメ",
    desc: "Hindi dub and multi audio anime — stream or download every episode in 480p, 720p or 1080p.",
  },
  movies: {
    chip: "Vault — Movies",
    jp: "映画保管庫",
    title: "Movies",
    accent: "Gallery",
    kanji: "映画",
    desc: "Blockbusters in Hindi and multi audio. Direct downloads and online streaming.",
  },
  series: {
    chip: "Vault — Series",
    jp: "シリーズ保管庫",
    title: "Web Series",
    accent: "Hub",
    kanji: "連続",
    desc: "Complete seasons — Hindi dubbed and originals. Binge without interruption.",
  },
};

const LANGS = ["Hindi", "English", "Japanese", "Tamil", "Telugu", "Korean", "Chinese"];

export default function Browse({ items, category }: { items: AnimeItem[]; category: string }) {
  const meta = META[category] ?? META.anime;
  const [genre, setGenre] = useState("All");
  const [lang, setLang] = useState("All");
  const [sort, setSort] = useState<"rating" | "az">("rating");
  const [shown, setShown] = useState(PAGE);

  useEffect(() => {
    setGenre("All");
    setLang("All");
    setSort("rating");
    setShown(PAGE);
  }, [category]);

  const catItems = useMemo(() => items.filter((i) => i.category === category), [items, category]);

  const genres = useMemo(() => {
    const s = new Set<string>();
    catItems.forEach((i) => i.genres.forEach((g) => s.add(g)));
    return ["All", ...[...s].sort()];
  }, [catItems]);

  const filtered = useMemo(() => {
    let r = catItems;
    if (genre !== "All") r = r.filter((i) => i.genres.includes(genre));
    if (lang !== "All") r = r.filter((i) => i.languages.includes(lang));
    if (sort === "rating") r = [...r].sort((a, b) => ratingOf(b) - ratingOf(a));
    else r = [...r].sort((a, b) => a.title.localeCompare(b.title));
    return r;
  }, [catItems, genre, lang, sort]);

  return (
    <div className="pt-20 md:pt-32">
      {/* banner */}
      <div className="relative overflow-hidden border-b border-line blueprint-oni">
        <p className="pointer-events-none absolute -right-6 top-0 select-none font-jp text-[11rem] md:text-[15rem] font-black leading-none text-paper/[0.03]">
          {meta.kanji}
        </p>
        <div className="pointer-events-none absolute -left-24 bottom-0 h-64 w-64 rounded-full bg-oni/12 blur-[100px]" />
        <div className="relative mx-auto max-w-7xl px-5 pb-12 pt-8 md:px-8">
          <div className="mb-5 flex items-center gap-4">
            <span className="border border-oni/40 bg-oni/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.35em] text-oni">
              {meta.chip}
            </span>
            <span className="font-jp text-xs font-bold text-ash">{meta.jp}</span>
          </div>
          <h1 className="font-display uppercase leading-[0.9] text-paper" style={{ fontSize: "clamp(2.8rem, 7vw, 6rem)" }}>
            {meta.title} <span className="text-stroke-oni">{meta.accent}</span>
          </h1>
          <p className="mt-4 max-w-xl text-sm md:text-base text-paper/60">{meta.desc}</p>
          <p className="mt-5 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.3em] text-oni">
            <Flame className="h-3.5 w-3.5 fill-current" />
            {filtered.length} signals detected
          </p>
        </div>
      </div>

      {/* filter bar */}
      <div className="sticky top-16 z-40 md:top-20 border-b border-line bg-ink/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-2 px-4 py-3 sm:gap-2.5 sm:px-5 md:px-8">
          <FilterSelect icon={<Shapes className="h-3 w-3 text-oni" />} label="Genre" value={genre} options={genres} onChange={(v) => { setGenre(v); setShown(PAGE); }} />
          <FilterSelect icon={<Languages className="h-3 w-3 text-spark" />} label="Audio" value={lang} options={["All", ...LANGS]} onChange={(v) => { setLang(v); setShown(PAGE); }} />
          <FilterSelect
            icon={<ChevronDown className="h-3 w-3 text-gold" />}
            label="Sort"
            value={sort}
            options={[["rating", "Top Rated"], ["az", "A — Z"]]}
            onChange={(v) => setSort(v as "rating" | "az")}
          />
          {(genre !== "All" || lang !== "All") && (
            <button
              onClick={() => { setGenre("All"); setLang("All"); setShown(PAGE); }}
              data-hover
              className="ml-auto font-mono text-[10px] uppercase tracking-[0.24em] text-oni transition-colors hover:text-paper"
            >
              Reset ×
            </button>
          )}
        </div>
      </div>

      {/* grid */}
      <div className="mx-auto max-w-7xl px-5 py-12 md:px-8">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 md:gap-5 lg:grid-cols-6">
          {filtered.slice(0, shown).map((it, i) => (
            <PosterCard key={it.id} item={it} index={i} fill />
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="py-24 text-center">
            <p className="font-display text-3xl uppercase text-paper/50">信号なし — no signal</p>
            <p className="mt-2 text-sm text-ash">No titles match this filter combination.</p>
          </div>
        )}

        {shown < filtered.length && (
          <div className="mt-14 flex justify-center">
            <button
              onClick={() => setShown((s) => s + PAGE)}
              data-hover
              className="slash-sweep bg-oni px-9 py-4 text-[11px] font-bold uppercase tracking-[0.3em] text-white transition-colors hover:bg-oni-deep cut-corner"
            >
              Load More · {filtered.length - shown} locked
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function FilterSelect({
  icon,
  label,
  value,
  options,
  onChange,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  options: (string | [string, string])[];
  onChange: (v: string) => void;
}) {
  return (
    <label className="flex items-center gap-2.5 border border-line bg-panel px-3.5 py-2 text-paper/80 transition-colors hover:border-oni/50">
      {icon}
      <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-ash">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="min-w-0 max-w-[104px] cursor-pointer bg-transparent text-[11px] font-semibold text-paper outline-none sm:max-w-none sm:text-[12px] [&>option]:bg-panel"
      >
        {options.map((o) =>
          Array.isArray(o) ? (
            <option key={o[0]} value={o[0]}>{o[1]}</option>
          ) : (
            <option key={o} value={o}>{o}</option>
          )
        )}
      </select>
    </label>
  );
}
