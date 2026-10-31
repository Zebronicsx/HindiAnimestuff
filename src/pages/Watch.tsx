import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Download,
  ExternalLink,
  Gauge,
  Maximize,
  Pause,
  Play,
  RotateCcw,
  RotateCw,
  Smartphone,
  Volume2,
  VolumeX,
  Zap,
} from "lucide-react";
import {
  AnimeItem,
  episodeList,
  FILE_TAG,
  fmtTime,
  formatOf,
  getProgress,
  hasEpisodes,
  Quality,
  qualitiesFor,
  setProgress,
} from "../lib/catalog";
import { isAndroid, openInVlc, triggerDownload } from "../lib/download";
import { href, navigate } from "../lib/router";

const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2];
const PROBE_MS = 7000;

type Phase = "probing" | "playing" | "unsupported";

export default function Watch({ item, ep, q }: { item: AnimeItem; ep: string; q: Quality }) {
  const isMovie = ep === "movie";
  const eps = useMemo(() => episodeList(item), [item]);
  const epIdx = isMovie ? -1 : eps.indexOf(ep);
  const qs = useMemo(() => qualitiesFor(item, isMovie ? undefined : ep), [item, ep, isMovie]);
  const current = qs.find((x) => x.q === q) ?? qs[0];
  const url = current?.url ?? "";
  const activeQ = current?.q ?? q;

  const format = useMemo(() => (url ? formatOf(url) : "FILE"), [url]);
  const isNative = format === "MP4";

  const video = useRef<HTMLVideoElement>(null);
  const wrap = useRef<HTMLDivElement>(null);
  const hideT = useRef<number>(0);
  const saveT = useRef(0);
  const probeT = useRef<number>(0);

  const [phase, setPhase] = useState<Phase>("probing");
  const [forced, setForced] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [dur, setDur] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [muted, setMuted] = useState(false);
  const [vol, setVol] = useState(1);
  const [rate, setRate] = useState(1);
  const [showUI, setShowUI] = useState(true);
  const [seeking, setSeeking] = useState(false);
  const [seekVal, setSeekVal] = useState(0);
  const [centerFx, setCenterFx] = useState<"play" | "pause" | null>(null);

  const flash = (t: "play" | "pause") => {
    setCenterFx(t);
    window.setTimeout(() => setCenterFx(null), 550);
  };

  const togglePlay = useCallback(() => {
    const v = video.current;
    if (!v) return;
    if (v.paused) {
      v.play().catch(() => {});
      flash("play");
    } else {
      v.pause();
      flash("pause");
    }
  }, []);

  const switchQuality = (nq: Quality) => {
    const t = video.current?.currentTime ?? 0;
    setProgress(item.id, { t, dur, ts: Date.now(), ep: isMovie ? undefined : ep, q: nq });
    navigate(`/watch/${item.id}/${isMovie ? "movie" : ep}/${nq}?t=${Math.floor(t)}`);
  };

  const goEp = (idx: number) => {
    if (idx < 0 || idx >= eps.length) return;
    navigate(`/watch/${item.id}/${eps[idx]}/${activeQ}`);
  };

  const tParam = useMemo(() => {
    const raw = window.location.hash.split("?t=")[1];
    return raw ? parseInt(raw, 10) : 0;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ep, q, item.id]);

  // route/quality change: reset + start probe
  useEffect(() => {
    setPhase("probing");
    setForced(false);
    setTime(0);
    setDur(0);
    setBuffered(0);
    setPlaying(false);
    const saved = getProgress(item.id, isMovie ? undefined : ep);
    const startAt = tParam || (saved && saved.t > 5 && saved.dur - saved.t > 15 ? saved.t : 0);
    const v = video.current;
    if (!v) return;
    const onMeta = () => {
      if (startAt && startAt < v.duration - 5) v.currentTime = startAt;
    };
    v.addEventListener("loadedmetadata", onMeta);
    v.load();
    v.play().catch(() => {});
    return () => v.removeEventListener("loadedmetadata", onMeta);
  }, [item.id, ep, q, isMovie, tParam]);

  // give the browser PROBE_MS to prove it can demux/play this file.
  // MKV usually fails silently (no error event), so a timeout is required.
  useEffect(() => {
    clearTimeout(probeT.current);
    if (phase === "playing") return;
    probeT.current = window.setTimeout(() => {
      const v = video.current;
      const ok = !!v && v.readyState >= 1 && isFinite(v.duration) && v.duration > 0;
      if (ok) setPhase("playing");
      else if (!isNative) setPhase("unsupported");
      else setPhase("unsupported");
    }, PROBE_MS);
    return () => clearTimeout(probeT.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, phase, isNative]);

  // keyboard shortcuts
  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      const v = video.current;
      if (!v) return;
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA") return;
      switch (e.key.toLowerCase()) {
        case " ":
        case "k":
          e.preventDefault();
          togglePlay();
          break;
        case "arrowright":
          v.currentTime += 5;
          break;
        case "arrowleft":
          v.currentTime -= 5;
          break;
        case "f":
          toggleFull();
          break;
        case "m":
          v.muted = !v.muted;
          setMuted(v.muted);
          break;
      }
    };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [togglePlay]);

  const toggleFull = () => {
    if (document.fullscreenElement) document.exitFullscreen();
    else wrap.current?.requestFullscreen().catch(() => {});
  };

  const poke = () => {
    setShowUI(true);
    clearTimeout(hideT.current);
    hideT.current = window.setTimeout(() => {
      if (!video.current?.paused) setShowUI(false);
    }, 2800);
  };

  useEffect(() => {
    poke();
    return () => clearTimeout(hideT.current);
  }, [playing]);

  const retryNative = () => {
    setForced(true);
    setPhase("probing");
    const v = video.current;
    if (v) {
      v.load();
      v.play().catch(() => {});
    }
  };

  if (!url) {
    return (
      <div className="grid min-h-screen place-items-center bg-ink px-6 text-center">
        <div>
          <AlertTriangle className="mx-auto mb-4 h-10 w-10 text-gold/70" />
          <p className="font-display text-2xl uppercase text-paper/70">No stream for this quality</p>
          <p className="mt-2 text-sm text-ash">This source has no file uploaded for that resolution.</p>
          <a href={href(`/title/${item.id}`)} className="mt-5 inline-block text-sm font-bold uppercase tracking-widest text-oni hover:underline">
            ← Back to title
          </a>
        </div>
      </div>
    );
  }

  const showFallback =
    phase === "unsupported" || (phase === "probing" && !forced && !isNative);

  return (
    <div className="min-h-screen bg-black">
      <div ref={wrap} className="relative select-none bg-black" onMouseMove={poke} onTouchStart={poke}>
        <video
          ref={video}
          src={url}
          className={`aspect-video max-h-[100svh] w-full bg-black sm:max-h-[86svh] ${showFallback ? "opacity-40" : ""}`}
          onClick={togglePlay}
          onDoubleClick={toggleFull}
          onPlay={() => {
            setPlaying(true);
            setPhase("playing");
          }}
          onPause={() => setPlaying(false)}
          onError={() => setPhase("unsupported")}
          onLoadedMetadata={() => {
            const v = video.current;
            if (v && isFinite(v.duration) && v.duration > 0) setPhase("playing");
            setDur(v?.duration || 0);
          }}
          onTimeUpdate={() => {
            const v = video.current!;
            if (!seeking) setTime(v.currentTime);
            if (Date.now() - saveT.current > 4000) {
              saveT.current = Date.now();
              setProgress(item.id, {
                t: v.currentTime,
                dur: v.duration || 0,
                ts: Date.now(),
                ep: isMovie ? undefined : ep,
                q: activeQ,
              });
            }
          }}
          onProgress={() => {
            const v = video.current;
            if (v && v.buffered.length) setBuffered(v.buffered.end(v.buffered.length - 1));
          }}
          onVolumeChange={() => {
            const v = video.current!;
            setVol(v.volume);
            setMuted(v.muted);
          }}
          playsInline
        />

        {/* center flash */}
        {centerFx && phase === "playing" && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <span className="grid h-20 w-20 place-items-center rounded-full border border-paper/25 bg-ink/70 backdrop-blur">
              {centerFx === "play" ? <Play className="ml-1 h-7 w-7 fill-paper" /> : <Pause className="h-7 w-7 fill-paper" />}
            </span>
          </div>
        )}

        {/* ---------- top bar ---------- */}
        <div
          className={`absolute inset-x-0 top-0 z-20 bg-gradient-to-b from-black/85 to-transparent px-4 pb-12 pt-4 transition-all duration-500 sm:px-6 ${
            showUI && phase === "playing" ? "opacity-100" : "pointer-events-none opacity-0"
          }`}
        >
          <div className="flex items-center gap-4">
            <a
              href={href(`/title/${item.id}`)}
              data-hover
              className="grid h-10 w-10 place-items-center border border-line bg-ink/70 text-paper/80 backdrop-blur transition-colors hover:border-oni hover:text-oni"
            >
              <ChevronLeft className="h-4 w-4" />
            </a>
            <div className="min-w-0">
              <p className="truncate font-display text-lg uppercase leading-tight text-paper sm:text-xl">
                {item.title}
              </p>
              <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-oni">
                {isMovie ? item.season : `${item.season.replace("Season", "S")} · E${parseInt(ep, 10)}`} · {activeQ} · {format}
              </p>
            </div>
            <span className="ml-auto hidden items-center gap-2 font-mono text-[9px] uppercase tracking-[0.3em] text-ash sm:flex">
              <Zap className="h-3 w-3 fill-oni text-oni" /> Freak Player
            </span>
          </div>
        </div>

        {/* ---------- bottom controls ---------- */}
        <div
          className={`absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-black/90 via-black/50 to-transparent px-4 pb-4 pt-16 transition-all duration-500 sm:px-6 ${
            showUI && phase === "playing" ? "opacity-100" : "pointer-events-none opacity-0"
          }`}
        >
          <div className="relative mb-4 h-[14px]">
            <div className="absolute top-[5px] h-[4px] w-full bg-paper/15">
              <div className="absolute inset-y-0 left-0 bg-paper/30" style={{ width: dur ? `${(buffered / dur) * 100}%` : 0 }} />
              <div className="absolute inset-y-0 left-0 bg-oni shadow-[0_0_10px_rgba(255,42,42,0.8)]" style={{ width: dur ? `${((seeking ? seekVal : time) / dur) * 100}%` : 0 }} />
            </div>
            <input
              type="range"
              min={0}
              max={dur || 0}
              step={0.1}
              value={seeking ? seekVal : time}
              onChange={(e) => {
                setSeeking(true);
                setSeekVal(parseFloat(e.target.value));
              }}
              onMouseUp={() => {
                if (video.current) video.current.currentTime = seekVal;
                setSeeking(false);
              }}
              onTouchEnd={() => {
                if (video.current) video.current.currentTime = seekVal;
                setSeeking(false);
              }}
              className="absolute inset-0 w-full cursor-pointer opacity-0"
              aria-label="Seek"
            />
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={togglePlay}
              data-hover
              className="slash-sweep grid h-11 w-11 place-items-center bg-oni text-white transition-colors hover:bg-oni-deep cut-corner-sm"
              aria-label="Play / pause"
            >
              {playing ? <Pause className="h-4.5 w-4.5 fill-current" /> : <Play className="ml-0.5 h-4.5 w-4.5 fill-current" />}
            </button>
            <button onClick={() => video.current && (video.current.currentTime -= 10)} data-hover className="p-2 text-paper/60 transition-colors hover:text-paper" aria-label="Back 10s">
              <RotateCcw className="h-4 w-4" />
            </button>
            <button onClick={() => video.current && (video.current.currentTime += 10)} data-hover className="p-2 text-paper/60 transition-colors hover:text-paper" aria-label="Forward 10s">
              <RotateCw className="h-4 w-4" />
            </button>
            <span className="ml-1 font-mono text-[11px] tabular-nums text-paper/70">
              {fmtTime(time)} <span className="text-ash">/ {fmtTime(dur)}</span>
            </span>

            <div className="ml-auto flex items-center gap-1.5 sm:gap-2.5">
              <div className="flex border border-paper/15">
                {qs.map(({ q: qq, url: qu }) => (
                  <button
                    key={qq}
                    onClick={() => switchQuality(qq)}
                    data-hover
                    title={`${qq} · ${formatOf(qu)}`}
                    className={`px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-wider transition-colors sm:px-3 ${
                      qq === activeQ ? "bg-oni font-bold text-white" : "text-paper/55 hover:text-paper"
                    }`}
                  >
                    {qq}
                  </button>
                ))}
              </div>

              <div className="group/speed relative">
                <button data-hover className="p-2 text-paper/60 transition-colors hover:text-paper" aria-label="Speed">
                  <Gauge className="h-4 w-4" />
                </button>
                <div className="absolute bottom-full right-0 mb-2 hidden border border-line bg-coal group-hover/speed:block">
                  {SPEEDS.map((s) => (
                    <button
                      key={s}
                      onClick={() => {
                        if (video.current) video.current.playbackRate = s;
                        setRate(s);
                      }}
                      className={`block w-full px-4 py-1.5 text-left font-mono text-[12px] transition-colors hover:bg-oni/20 ${
                        s === rate ? "font-bold text-oni" : "text-paper/70"
                      }`}
                    >
                      {s}×
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={() => {
                  if (video.current) video.current.muted = !video.current.muted;
                }}
                data-hover
                className="p-2 text-paper/60 transition-colors hover:text-paper"
                aria-label="Mute"
              >
                {muted || vol === 0 ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={muted ? 0 : vol}
                onChange={(e) => {
                  const v = parseFloat(e.target.value);
                  if (video.current) {
                    video.current.volume = v;
                    video.current.muted = v === 0;
                  }
                }}
                className="hidden w-16 accent-[#ff2a2a] sm:block sm:w-20"
                aria-label="Volume"
              />
              <button onClick={toggleFull} data-hover className="p-2 text-paper/60 transition-colors hover:text-paper" aria-label="Fullscreen">
                <Maximize className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* ---------- format guard / player fallback ---------- */}
        {showFallback && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center overflow-y-auto bg-ink/92 px-5 py-10 text-center backdrop-blur blueprint-oni">
            <div className="pointer-events-none absolute inset-0 grid place-items-center">
              <span className="text-stroke font-display text-[18vw] uppercase leading-none opacity-20 select-none">MKV</span>
            </div>

            <div className="relative flex w-full max-w-xl flex-col items-center">
              <span className="mb-5 flex items-center gap-2 border border-oni/40 bg-oni/10 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.3em] text-oni">
                {isNative ? <Zap className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
                {format === "MP4" ? "MP4 · native stream" : format === "MKV" ? "MKV container detected" : "download page · not a raw stream"}
              </span>

              <h3 className="font-display text-3xl uppercase leading-[0.95] text-paper sm:text-4xl">
                {format === "MP4" ? (
                  <>Preparing your <span className="text-spark">stream</span></>
                ) : format === "MKV" ? (
                  <>This file needs a <span className="text-oni">native player</span></>
                ) : (
                  <>This link opens a <span className="text-oni">download page</span></>
                )}
              </h3>
              <p className="mt-3 max-w-md text-[13px] leading-relaxed text-paper/60 sm:text-sm">
                {format === "MP4"
                  ? "Connecting to the source. If playback does not start in a few seconds, download the file or open the direct link below."
                  : format === "MKV"
                  ? "Your source only provides MKV (x264 / x265 HEVC) files. Browsers cannot open that container — the player would stay black. Download the file and watch it instantly in VLC, MX Player or any video player."
                  : "This quality points to the host's landing page, not a playable video file. Use the download button, then open the file from the host in VLC or MX Player."}
              </p>

              <div className="mt-6 flex w-full flex-col gap-2.5 sm:flex-row sm:justify-center">
                <button
                  onClick={() => triggerDownload(url, `${item.title} ${activeQ}`)}
                  data-hover
                  className="slash-sweep flex items-center justify-center gap-2.5 bg-oni px-7 py-3.5 text-[11px] font-bold uppercase tracking-[0.24em] text-white transition-colors hover:bg-oni-deep cut-corner-sm"
                >
                  <Download className="h-4 w-4" /> Download {activeQ} · {format}
                </button>
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-hover
                  className="flex items-center justify-center gap-2.5 border border-paper/25 px-7 py-3.5 text-[11px] font-bold uppercase tracking-[0.24em] text-paper transition-colors hover:border-oni hover:text-oni"
                >
                  <ExternalLink className="h-4 w-4" /> Open direct link
                </a>
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-ash">
                {isAndroid() && (
                  <button onClick={() => openInVlc(url)} data-hover className="flex items-center gap-1.5 hover:text-paper">
                    <Smartphone className="h-3 w-3" /> Play in VLC
                  </button>
                )}
                <button onClick={retryNative} data-hover className="flex items-center gap-1.5 hover:text-spark">
                  <Play className="h-3 w-3" /> Try browser playback
                </button>
              </div>

              <p className="mt-5 font-mono text-[9.5px] uppercase tracking-[0.2em] leading-relaxed text-ash/70">
                {phase === "probing" ? "Testing native playback… " : ""}
                {FILE_TAG}Episode {isMovie ? "" : `· E${parseInt(ep, 10)} `}· {activeQ} · {format}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ---------- below player ---------- */}
      <div className="mx-auto max-w-7xl bg-ink px-5 py-10 md:px-8">
        <div className="mb-9 flex flex-wrap items-center gap-3">
          {!isMovie && (
            <>
              <button
                onClick={() => goEp(epIdx - 1)}
                disabled={epIdx <= 0}
                data-hover
                className="flex items-center gap-2 border border-line px-5 py-2.5 text-[11px] font-bold uppercase tracking-[0.22em] text-paper/75 transition-all hover:border-oni hover:text-oni disabled:opacity-30"
              >
                <ChevronLeft className="h-3.5 w-3.5" /> Prev Ep
              </button>
              <button
                onClick={() => goEp(epIdx + 1)}
                disabled={epIdx < 0 || epIdx >= eps.length - 1}
                data-hover
                className="slash-sweep flex items-center gap-2 bg-oni px-5 py-2.5 text-[11px] font-bold uppercase tracking-[0.22em] text-white transition-colors hover:bg-oni-deep disabled:opacity-30 cut-corner-sm"
              >
                Next Ep <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </>
          )}
          <button
            onClick={() => triggerDownload(url, `${item.title} ${activeQ}`)}
            data-hover
            className="ml-auto flex items-center gap-2 border border-spark/40 bg-spark/10 px-5 py-2.5 text-[11px] font-bold uppercase tracking-[0.22em] text-spark transition-all hover:bg-spark hover:text-ink"
          >
            <Download className="h-3.5 w-3.5" /> Download {activeQ}
          </button>
        </div>

        {hasEpisodes(item) && (
          <>
            <div className="mb-5 flex items-center gap-4">
              <h3 className="font-display text-xl uppercase text-paper md:text-2xl">All Episodes</h3>
              <span className="font-jp text-xs font-bold text-oni">全エピソード</span>
              <span className="h-px flex-1 bg-line" />
              <span className="font-mono text-[10px] tracking-[0.25em] text-ash">{eps.length} EP</span>
            </div>
            <div className="grid grid-cols-5 gap-2 sm:grid-cols-8 lg:grid-cols-12">
              {eps.map((e) => {
                const active = e === ep;
                return (
                  <button
                    key={e}
                    onClick={() => navigate(`/watch/${item.id}/${e}/${activeQ}`)}
                    data-hover
                    className={`py-3 font-mono text-sm font-bold transition-all ${
                      active
                        ? "bg-oni text-white shadow-[0_0_20px_rgba(255,42,42,0.5)]"
                        : "border border-line bg-panel text-ash hover:border-oni/60 hover:text-paper"
                    }`}
                  >
                    {parseInt(e, 10)}
                  </button>
                );
              })}
            </div>
          </>
        )}

        <div className="relative mt-10 overflow-hidden border border-line bg-panel p-6 md:p-8">
          <div className="blueprint pointer-events-none absolute inset-0 opacity-30" />
          <p className="relative font-mono text-[10px] uppercase tracking-[0.35em] text-oni">
            Now Playing · {activeQ} · {format}
          </p>
          <h4 className="relative mt-2 font-display text-2xl uppercase text-paper md:text-3xl">
            {item.title} {!isMovie && <span className="text-oni">· EP {parseInt(ep, 10)}</span>}
          </h4>
          <p className="relative mt-3 max-w-3xl text-sm leading-relaxed text-paper/55">{item.description}</p>
          <p className="relative mt-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-ash">
            Audio: {item.languages.join(", ")} · Subs: {item.subtitle || "N/A"}
          </p>
        </div>
      </div>
    </div>
  );
}
