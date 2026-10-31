import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Captions,
  Check,
  Clock,
  Copy,
  Download,
  Flame,
  Languages,
  Play,
  Plus,
  Star,
  Tv,
} from "lucide-react";
import {
  AnimeItem,
  episodeList,
  fileNameFromUrl,
  firstEpisode,
  formatOf,
  getMyList,
  hasEpisodes,
  onMyListChange,
  poster,
  preferredQuality,
  qualitiesFor,
  toggleMyList,
} from "../lib/catalog";
import { copyLink, triggerDownload } from "../lib/download";
import { href } from "../lib/router";
import Row from "../components/Row";
import PosterCard from "../components/PosterCard";
import { EASE } from "../components/fx";

const Q_STYLE: Record<string, string> = {
  "1080p": "border-oni/50 text-oni hover:bg-oni",
  "720p": "border-spark/50 text-spark hover:bg-spark hover:text-ink",
  "480p": "border-paper/30 text-paper/70 hover:bg-paper hover:text-ink",
};

export default function Detail({
  item,
  allItems,
  tab,
}: {
  item: AnimeItem;
  allItems: AnimeItem[];
  tab: "watch" | "download";
}) {
  const [mode, setMode] = useState<"watch" | "download">(tab);
  const [list, setList] = useState<string[]>(getMyList());
  useEffect(() => onMyListChange(() => setList(getMyList())), []);
  useEffect(() => setMode(tab), [tab, item.id]);

  const eps = useMemo(() => episodeList(item), [item]);
  const inList = list.includes(item.id);

  const related = useMemo(
    () =>
      allItems
        .filter(
          (i) =>
            i.id !== item.id &&
            i.category === item.category &&
            i.genres.some((g) => item.genres.includes(g))
        )
        .sort((a, b) => parseFloat(b.rating) - parseFloat(a.rating))
        .slice(0, 16),
    [allItems, item]
  );

  const sourceFirst = qualitiesFor(item, hasEpisodes(item) ? firstEpisode(item) : undefined);
  const sourceFormat = sourceFirst[0] ? formatOf(sourceFirst[0].url) : null;

  const firstWatch = hasEpisodes(item)
    ? href(`/watch/${item.id}/${firstEpisode(item)}/${preferredQuality(item, firstEpisode(item))}`)
    : href(`/watch/${item.id}/movie/${preferredQuality(item)}`);

  return (
    <div className="pt-16 md:pt-20">
      {/* ---------- backdrop header ---------- */}
      <div className="relative overflow-hidden blueprint-oni">
        <img src={poster(item, "w780")} alt="" className="absolute inset-0 h-full w-full object-cover opacity-25 scale-110 blur-[3px]" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/75 to-ink/35" />
        <div className="pointer-events-none absolute -left-32 top-10 h-96 w-96 rounded-full bg-oni/15 blur-[110px]" />

        <div className="relative mx-auto grid max-w-7xl gap-10 px-5 pb-14 pt-12 md:grid-cols-[250px_1fr] md:px-8 lg:grid-cols-[300px_1fr]">
          {/* poster */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: EASE }}
            className="mx-auto w-[200px] sm:w-[240px] md:w-full"
          >
            <div className="relative overflow-hidden rounded-2xl border border-oni/40 shadow-[0_30px_90px_-18px_rgba(255,42,42,0.55)]" style={{ aspectRatio: "2/3" }}>
              <img src={poster(item, "w500")} alt={item.title} className="h-full w-full object-cover" />
            </div>
            <p className="mt-3 text-center font-mono text-[9.5px] uppercase tracking-[0.2em] leading-relaxed text-ash">
              {item.quality_tag}
            </p>
          </motion.div>

          {/* info */}
          <div className="min-w-0">
            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.7, ease: EASE }} className="mb-5 flex flex-wrap items-center gap-4">
              <span className="border border-oni/40 bg-oni/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.35em] text-oni">
                {item.category} — {item.type}
              </span>
              <span className="font-jp text-xs font-bold text-ash">タイトル詳細</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.18, duration: 0.8, ease: EASE }}
              className="font-display uppercase leading-[0.92] text-paper"
              style={{ fontSize: "clamp(2.4rem, 5.4vw, 4.6rem)" }}
            >
              {item.title}
            </motion.h1>

            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="mt-3 flex items-center gap-2 font-jp text-xs font-bold tracking-[0.3em] text-oni">
              <Flame className="h-3.5 w-3.5 fill-current" />
              {item.season === "Movie" ? "映画" : item.season} {item.episode_tag ? `· ${item.episode_tag}` : ""}
            </motion.p>

            {/* meta chips */}
            <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.36, duration: 0.7, ease: EASE }} className="mt-6 flex flex-wrap gap-2.5">
              <MetaChip icon={<Star className="h-3 w-3 fill-[#ffc22e] text-[#ffc22e]" />} text={`${item.rating || "—"} / 10`} />
              {item.runtime && <MetaChip icon={<Clock className="h-3 w-3 text-spark" />} text={item.runtime} />}
              {item.episodes && item.episodes !== "0" && (
                <MetaChip icon={<Tv className="h-3 w-3 text-oni" />} text={`${hasEpisodes(item) ? eps.length : item.episodes} EPISODES`} />
              )}
              <MetaChip icon={<Languages className="h-3 w-3 text-gold" />} text={item.languages.join(" · ")} />
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.42, duration: 0.7, ease: EASE }} className="mt-3 flex flex-wrap gap-2">
              {item.genres.map((g) => (
                <span key={g} className="border border-line bg-panel/80 px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-paper/70">
                  {g}
                </span>
              ))}
            </motion.div>

            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.48 }} className="mt-6 max-w-3xl text-sm md:text-[15px] leading-relaxed text-paper/65">
              {item.description}
            </motion.p>

            {item.subtitle && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.54 }} className="mt-4 flex max-w-2xl items-start gap-2 text-[12px] text-paper/45">
                <Captions className="mt-0.5 h-3.5 w-3.5 shrink-0 text-spark" />
                {item.subtitle}
              </motion.p>
            )}

            {sourceFormat && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.56 }} className="mt-4 flex max-w-2xl flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-ash">
                <span className="border border-line bg-panel px-2 py-1 text-paper/70">Source: {sourceFormat}</span>
                <span>Browser can't open MKV — download for VLC / MX Player. MP4 streams instantly.</span>
              </motion.p>
            )}

            {/* actions */}
            <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6, duration: 0.7, ease: EASE }} className="mt-9 flex flex-wrap items-center gap-4">
              <a
                href={firstWatch}
                data-hover
                className="slash-sweep group flex items-center gap-3 bg-oni px-8 py-4 text-xs font-bold uppercase tracking-[0.3em] text-white transition-colors hover:bg-oni-deep cut-corner"
              >
                <Play className="h-4 w-4 fill-current transition-transform group-hover:scale-125" />
                Watch Now
              </a>
              <button
                onClick={() => toggleMyList(item.id)}
                data-hover
                className={`flex items-center gap-3 border px-8 py-4 text-xs font-bold uppercase tracking-[0.3em] transition-all ${
                  inList
                    ? "border-oni bg-oni/10 text-oni"
                    : "border-paper/25 text-paper hover:border-oni hover:text-oni"
                }`}
              >
                {inList ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                {inList ? "In Vault" : "Save to List"}
              </button>
            </motion.div>
          </div>
        </div>
      </div>

      {/* ---------- mode switch ---------- */}
      <div className="sticky top-16 z-40 border-y border-line bg-ink/85 backdrop-blur-xl md:top-20">
        <div className="mx-auto flex max-w-7xl items-center justify-center gap-3 px-5 py-3.5 md:px-8">
          <ModeButton active={mode === "watch"} onClick={() => setMode("watch")} icon={<Play className="h-3.5 w-3.5 fill-current" />} label="Watch Online" jp="見る" />
          <ModeButton active={mode === "download"} onClick={() => setMode("download")} icon={<Download className="h-3.5 w-3.5" />} label="Download" jp="保存" />
        </div>
      </div>

      {/* ---------- content ---------- */}
      <div className="mx-auto max-w-7xl px-5 py-12 md:px-8">
        {mode === "watch" ? <WatchSection item={item} eps={eps} /> : <DownloadSection item={item} eps={eps} />}
      </div>

      {/* ---------- related ---------- */}
      {related.length > 0 && (
        <Row num="07" chip="Similar" jp="これも見て" title="More from this" accent="dimension">
          {related.map((it, i) => (
            <PosterCard key={it.id} item={it} index={i} />
          ))}
        </Row>
      )}
    </div>
  );
}

function MetaChip({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <span className="flex items-center gap-2 border border-line bg-panel/80 px-3.5 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-paper/80">
      {icon}
      {text}
    </span>
  );
}

function ModeButton({
  active,
  onClick,
  icon,
  label,
  jp,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  jp: string;
}) {
  return (
    <button
      onClick={onClick}
      data-hover
      className={`flex items-center gap-2.5 px-6 py-3 text-[11px] font-bold uppercase tracking-[0.25em] transition-all duration-300 cut-corner-sm md:px-9 ${
        active
          ? "slash-sweep bg-oni text-white shadow-[0_10px_35px_-8px_rgba(255,42,42,0.8)]"
          : "border border-line text-ash hover:border-oni/60 hover:text-paper"
      }`}
    >
      {icon}
      {label}
      <span className={`font-jp text-[10px] ${active ? "text-white/80" : "text-oni/70"}`}>{jp}</span>
    </button>
  );
}

/* ============================== WATCH ============================== */

function WatchSection({ item, eps }: { item: AnimeItem; eps: string[] }) {
  if (hasEpisodes(item)) {
    return (
      <div>
        <BlockHead jp="エピソード配信" title="Stream Episodes" sub={`${eps.length} EPISODES · SELECT A QUALITY TO PLAY`} />
        <div className="mb-5 flex flex-wrap items-center gap-3 border border-gold/25 bg-gold/[0.05] px-4 py-3">
          <Flame className="h-4 w-4 shrink-0 text-gold" />
          <p className="text-[12px] leading-relaxed text-paper/65">
            <span className="font-bold uppercase tracking-[0.14em] text-gold">Heads up:</span> most source files are
            MKV. If the player stays black, switch to{" "}
            <span className="text-paper">Download</span> and open the file in VLC or MX Player. MP4 sources stream
            instantly in any browser.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {eps.map((ep, i) => {
            const qs = qualitiesFor(item, ep);
            return (
              <motion.div
                key={ep}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-30px" }}
                transition={{ duration: 0.5, delay: Math.min(i, 9) * 0.05 }}
                className="group border border-line bg-panel p-5 transition-all duration-300 hover:border-oni/60 hover:shadow-[0_20px_60px_-20px_rgba(255,42,42,0.4)]"
              >
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span className="font-display text-4xl leading-none text-stroke-oni group-hover:text-oni group-hover:[-webkit-text-stroke:0px] transition-all">
                      {String(parseInt(ep, 10)).padStart(2, "0")}
                    </span>
                    <div className="leading-tight">
                      <p className="text-sm font-bold uppercase tracking-wider text-paper">Episode {parseInt(ep, 10)}</p>
                      <p className="mt-0.5 font-jp text-[10px] tracking-[0.2em] text-ash">
                        {item.season} · {item.runtime}
                      </p>
                    </div>
                  </div>
                  <Play className="h-4 w-4 text-ash transition-colors group-hover:text-oni group-hover:fill-oni" />
                </div>
                <div className="flex gap-2">
                  {qs.map(({ q, url }) => (
                    <a
                      key={q}
                      href={href(`/watch/${item.id}/${ep}/${q}`)}
                      data-hover
                      title={`${q} · ${formatOf(url)}`}
                      className={`flex flex-1 items-center justify-center gap-1.5 border bg-ink/60 px-2 py-2.5 text-center text-[11px] font-bold uppercase tracking-widest transition-all hover:text-white cut-corner-sm ${Q_STYLE[q]}`}
                    >
                      {q}
                      <span className="text-[8px] font-semibold opacity-55">{formatOf(url)}</span>
                    </a>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    );
  }
  return <QualityCards item={item} mode="watch" />;
}

/* ============================== DOWNLOAD ============================== */

function DownloadSection({ item, eps }: { item: AnimeItem; eps: string[] }) {
  if (hasEpisodes(item)) {
    return (
      <div>
        <BlockHead jp="エピソード保存" title="Download Episodes" sub={`${eps.length} EPISODES · DIRECT HIGH-SPEED LINKS`} />
        <DownloadNotice />
        <div className="space-y-2.5">
          {eps.map((ep, i) => {
            const qs = qualitiesFor(item, ep);
            return (
              <motion.div
                key={ep}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-20px" }}
                transition={{ duration: 0.45, delay: Math.min(i, 10) * 0.04 }}
                className="flex flex-wrap items-center gap-4 border border-line bg-panel px-5 py-4 transition-all duration-300 hover:border-spark/50"
              >
                <span className="w-14 shrink-0 font-display text-2xl text-paper">
                  E{String(parseInt(ep, 10)).padStart(2, "0")}
                </span>
                <span className="hidden font-jp text-[10px] tracking-[0.2em] text-ash sm:block">
                  {item.runtime} · マルチオーディオ
                </span>
                <div className="ml-auto flex gap-2">
                  {qs.map(({ q, url }) => (
                    <button
                      key={q}
                      onClick={() => triggerDownload(url, `${item.title} E${parseInt(ep, 10)} ${q}`)}
                      data-hover
                      title={`${q} · ${formatOf(url)} · ${fileNameFromUrl(url)}`}
                      className={`flex items-center gap-1.5 border bg-ink/60 px-3 py-2 text-[11px] font-bold uppercase tracking-widest transition-all cut-corner-sm ${Q_STYLE[q]}`}
                    >
                      <Download className="h-3 w-3" />
                      {q}
                      <span className="opacity-50">{formatOf(url)}</span>
                    </button>
                  ))}
                  <button
                    onClick={() => copyLink(qs[qs.length - 1].url)}
                    data-hover
                    title="Copy direct link"
                    aria-label="Copy direct link"
                    className="grid place-items-center border border-line bg-ink/60 px-2.5 text-ash transition-colors hover:border-spark hover:text-spark cut-corner-sm"
                  >
                    <Copy className="h-3 w-3" />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    );
  }
  return <QualityCards item={item} mode="download" />;
}

/* ------------- movie / single-file quality cards ------------- */

function QualityCards({ item, mode }: { item: AnimeItem; mode: "watch" | "download" }) {
  const qs = qualitiesFor(item);
  if (!qs.length)
    return (
      <div className="grid place-items-center py-24 text-center">
        <Flame className="mb-4 h-10 w-10 text-oni/50" />
        <p className="font-display text-2xl uppercase text-paper/60">Links coming soon</p>
        <p className="mt-2 text-sm text-ash">This title has no streams in the vault yet.</p>
      </div>
    );
  return (
    <div>
      <BlockHead
        jp={mode === "watch" ? "フル動画" : "フル保存"}
        title={mode === "watch" ? "Stream Full Video" : "Download Full Video"}
        sub={mode === "watch" ? "PICK YOUR QUALITY · NATIVE PLAYER OR DOWNLOAD" : "DIRECT LINKS · RESUME SUPPORTED"}
      />
      {mode === "download" && <DownloadNotice />}
      <div className="grid max-w-4xl gap-5 sm:grid-cols-3">
        {qs.map(({ q, url }) => (
          <div key={q} className="group relative overflow-hidden border border-line bg-panel p-7 text-center transition-all duration-300 hover:border-oni/60">
            <div className="blueprint pointer-events-none absolute inset-0 opacity-40" />
            <p className="relative font-display text-4xl text-paper">{q}</p>
            <p className="relative mt-1 font-mono text-[9.5px] uppercase tracking-[0.22em] text-ash">
              {q === "1080p" ? "FHD · x265 10bit" : q === "720p" ? "HD · x264" : "SD · WEB-DL"}
            </p>
            {mode === "watch" ? (
              <a
                href={href(`/watch/${item.id}/movie/${q}`)}
                data-hover
                className="slash-sweep relative mt-6 flex items-center justify-center gap-2 bg-oni py-3.5 text-xs font-bold uppercase tracking-[0.24em] text-white transition-colors hover:bg-oni-deep cut-corner-sm"
              >
                <Play className="h-3.5 w-3.5 fill-current" /> Play
              </a>
            ) : (
              <button
                onClick={() => triggerDownload(url, `${item.title} ${q}`)}
                data-hover
                className="slash-sweep relative mt-6 flex w-full items-center justify-center gap-2 bg-oni py-3.5 text-xs font-bold uppercase tracking-[0.24em] text-white transition-colors hover:bg-oni-deep cut-corner-sm"
              >
                <Download className="h-3.5 w-3.5" /> Download
              </button>
            )}
            {mode === "watch" ? (
              <button
                onClick={() => triggerDownload(url, `${item.title} ${q}`)}
                data-hover
                className="relative mt-3 flex w-full items-center justify-center gap-1.5 py-1 text-[11px] font-semibold uppercase tracking-widest text-ash transition-colors hover:text-paper"
              >
                <Download className="h-3 w-3" /> or download the file
              </button>
            ) : (
              <a href={href(`/watch/${item.id}/movie/${q}`)} data-hover className="relative mt-3 flex items-center justify-center gap-1.5 py-1 text-[11px] font-semibold uppercase tracking-widest text-ash transition-colors hover:text-paper">
                <Play className="h-3 w-3" /> or stream online
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function DownloadNotice() {
  return (
    <div className="mb-5 flex flex-wrap items-center gap-4 border border-spark/25 bg-spark/[0.06] px-4 py-3.5">
      <Download className="h-4 w-4 shrink-0 text-spark" />
      <p className="text-[12px] leading-relaxed text-paper/70">
        <span className="font-bold uppercase tracking-[0.14em] text-spark">One-click downloads.</span>{" "}
        Files are hosted by the source as <span className="text-paper">MKV / MP4</span>. Open MKV in VLC or MX Player
        after downloading. If a browser blocks the download, copy the link and paste it in a new tab.
      </p>
    </div>
  );
}

function BlockHead({ jp, title, sub }: { jp: string; title: string; sub: string }) {
  return (
    <div className="mb-8">
      <div className="flex items-center gap-4">
        <h2 className="font-display text-2xl uppercase text-paper md:text-3xl">{title}</h2>
        <span className="font-jp text-xs font-bold text-oni">{jp}</span>
        <span className="h-px flex-1 bg-line" />
      </div>
      <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.3em] text-ash">{sub}</p>
    </div>
  );
}
