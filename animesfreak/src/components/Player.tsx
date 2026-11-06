"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Play, Pause, RotateCcw, RotateCw, Volume2, Volume1, VolumeX,
  Maximize, Minimize, PictureInPicture2, SkipForward, ChevronLeft,
  Loader2, AlertTriangle, Gauge, Download, FastForward,
} from "lucide-react";
import { useToast } from "./providers";
import { fmtTime } from "@/lib/types";

const RATES = [0.5, 0.75, 1, 1.25, 1.5, 2];

export interface PlayerProps {
  src: string;
  poster: string;
  title: string;
  epLabel: string;
  backHref: string;
  initialPos: number;
  hasNext: boolean;
  onNext: () => void;
  onEnded: () => void;
  onProgress: (pos: number, dur: number) => void;
  onDownloads: () => void;
}

export default function Player(p: PlayerProps) {
  const vref = useRef<HTMLVideoElement>(null);
  const wrap = useRef<HTMLDivElement>(null);
  const seekRef = useRef<HTMLDivElement>(null);
  const hideT = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSave = useRef(0);
  const metaDone = useRef(false);
  const timeRef = useRef(0);
  const durRef = useRef(0);
  const onProgressRef = useRef(p.onProgress);
  onProgressRef.current = p.onProgress;

  const { toast } = useToast();
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [dur, setDur] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [vol, setVol] = useState(1);
  const [muted, setMuted] = useState(false);
  const [rate, setRate] = useState(1);
  const [rateOpen, setRateOpen] = useState(false);
  const [fs, setFs] = useState(false);
  const [show, setShow] = useState(true);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [hoverPct, setHoverPct] = useState<number | null>(null);
  const [pipOk, setPipOk] = useState(false);

  useEffect(() => {
    setPipOk(typeof document !== "undefined" && "pictureInPictureEnabled" in document);
  }, []);

  /* ------- controls visibility ------- */
  const poke = useCallback(() => {
    setShow(true);
    if (hideT.current) clearTimeout(hideT.current);
    hideT.current = setTimeout(() => {
      const v = vref.current;
      if (v && !v.paused) setShow(false);
    }, 2800);
  }, []);

  useEffect(() => {
    if (!playing) setShow(true);
    else poke();
  }, [playing, poke]);

  /* ------- actions ------- */
  const togglePlay = useCallback(() => {
    const v = vref.current;
    if (!v) return;
    if (v.paused) v.play().catch(() => {});
    else v.pause();
  }, []);

  const skip = useCallback((sec: number) => {
    const v = vref.current;
    if (!v) return;
    v.currentTime = Math.max(0, Math.min(v.duration || 0, v.currentTime + sec));
    setTime(v.currentTime);
    poke();
  }, [poke]);

  const setVolume = useCallback((nv: number) => {
    const v = vref.current;
    if (!v) return;
    const c = Math.max(0, Math.min(1, nv));
    v.volume = c;
    v.muted = c === 0;
    setVol(c);
    setMuted(c === 0);
  }, []);

  const toggleMute = useCallback(() => {
    const v = vref.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
  }, []);

  const toggleFs = useCallback(() => {
    const el = wrap.current;
    if (!el) return;
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    else el.requestFullscreen().catch(() => {});
  }, []);

  const togglePip = useCallback(async () => {
    const v = vref.current;
    if (!v) return;
    try {
      if (document.pictureInPictureElement) await document.exitPictureInPicture();
      else await v.requestPictureInPicture();
    } catch {
      toast("PiP is browser mein available nahi hai", { type: "info" });
    }
  }, [toast]);

  const changeRate = (r: number) => {
    const v = vref.current;
    if (v) v.playbackRate = r;
    setRate(r);
    setRateOpen(false);
  };

  /* ------- keyboard ------- */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT") return;
      switch (e.key.toLowerCase()) {
        case " ": case "k": e.preventDefault(); togglePlay(); break;
        case "arrowleft": case "j": e.preventDefault(); skip(-10); break;
        case "arrowright": case "l": e.preventDefault(); skip(10); break;
        case "arrowup": e.preventDefault(); setVolume((vref.current?.volume ?? 1) + 0.1); poke(); break;
        case "arrowdown": e.preventDefault(); setVolume((vref.current?.volume ?? 1) - 0.1); poke(); break;
        case "m": toggleMute(); poke(); break;
        case "f": toggleFs(); break;
        case "n": if (p.hasNext) p.onNext(); break;
        case "p": togglePip(); break;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [togglePlay, skip, setVolume, toggleMute, toggleFs, togglePip, poke, p.hasNext, p.onNext]);

  /* ------- fullscreen + save on unmount/hide ------- */
  useEffect(() => {
    const onFs = () => setFs(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onFs);
    const save = () => {
      if (timeRef.current > 3) onProgressRef.current(timeRef.current, durRef.current);
    };
    const onVis = () => { if (document.visibilityState === "hidden") save(); };
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("pagehide", save);
    return () => {
      document.removeEventListener("fullscreenchange", onFs);
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("pagehide", save);
      save();
      if (hideT.current) clearTimeout(hideT.current);
    };
  }, []);

  /* ------- seek bar ------- */
  const pctFromEvent = (e: React.PointerEvent | React.MouseEvent) => {
    const el = seekRef.current;
    if (!el) return 0;
    const r = el.getBoundingClientRect();
    return Math.max(0, Math.min(1, (e.clientX - r.left) / r.width));
  };
  const seekTo = (pct: number) => {
    const v = vref.current;
    if (!v || !dur) return;
    v.currentTime = pct * dur;
    setTime(pct * dur);
  };

  const pct = dur > 0 ? (time / dur) * 100 : 0;
  const bufPct = dur > 0 ? (buffered / dur) * 100 : 0;
  const VolIcon = muted || vol === 0 ? VolumeX : vol < 0.5 ? Volume1 : Volume2;
  const showSkipIntro = dur > 300 && time > 3 && time < 90;

  return (
    <div
      ref={wrap}
      onMouseMove={poke}
      onTouchStart={poke}
      className={`group/player relative w-full select-none overflow-hidden bg-black ${fs ? "" : "rounded-2xl border border-white/[0.07]"} ${show ? "" : "cursor-none"}`}
    >
      <div className={fs ? "flex h-full items-center" : "relative aspect-video"}>
        <video
          ref={vref}
          src={p.src}
          poster={p.poster}
          className="h-full w-full"
          playsInline
          preload="metadata"
          onClick={togglePlay}
          onDoubleClick={toggleFs}
          onPlay={() => { setPlaying(true); setErr(false); }}
          onPause={() => {
            setPlaying(false);
            if (timeRef.current > 3) onProgressRef.current(timeRef.current, durRef.current);
          }}
          onWaiting={() => setLoading(true)}
          onPlaying={() => setLoading(false)}
          onCanPlay={() => setLoading(false)}
          onError={() => { setErr(true); setLoading(false); }}
          onEnded={() => { setPlaying(false); p.onEnded(); }}
          onLoadedMetadata={() => {
            const v = vref.current;
            if (!v) return;
            setDur(v.duration);
            durRef.current = v.duration;
            if (!metaDone.current) {
              metaDone.current = true;
              if (p.initialPos > 5 && p.initialPos < v.duration * 0.95) {
                v.currentTime = p.initialPos;
                setTime(p.initialPos);
                toast(`Wahin se resume — ${fmtTime(p.initialPos)}`, {
                  type: "info",
                  action: { label: "Shuru se", onClick: () => { if (vref.current) vref.current.currentTime = 0; } },
                });
              }
              v.play().catch(() => {});
            }
          }}
          onTimeUpdate={() => {
            const v = vref.current;
            if (!v) return;
            timeRef.current = v.currentTime;
            if (!dragging) setTime(v.currentTime);
            if (v.buffered.length > 0) setBuffered(v.buffered.end(v.buffered.length - 1));
            if (Math.abs(v.currentTime - lastSave.current) > 5) {
              lastSave.current = v.currentTime;
              onProgressRef.current(v.currentTime, v.duration || 0);
            }
          }}
        />

        {/* buffering */}
        {loading && !err && (
          <div className="pointer-events-none absolute inset-0 grid place-items-center">
            <Loader2 className="size-12 animate-spin text-primary-soft drop-shadow-lg" />
          </div>
        )}

        {/* big center play */}
        {!playing && !err && !loading && (
          <button
            onClick={togglePlay}
            aria-label="Play"
            className="btn-primary absolute inset-0 m-auto grid size-20 place-items-center rounded-full transition-transform hover:scale-105"
          >
            <Play className="size-8 fill-white text-white" />
          </button>
        )}

        {/* error */}
        {err && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-4 bg-black/90 px-6 text-center">
            <AlertTriangle className="size-10 text-gold" />
            <div>
              <p className="font-display text-lg font-bold">Stream load nahi ho paya 😵</p>
              <p className="mt-1 text-[12.5px] text-mute">Network check karo, ya download karke VLC mein dekho.</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => { setErr(false); vref.current?.load(); }}
                className="btn-primary focus-ring rounded-full px-5 py-2 text-sm font-bold text-white"
              >
                Retry
              </button>
              <button
                onClick={p.onDownloads}
                className="focus-ring glass rounded-full px-5 py-2 text-sm font-bold text-fg"
              >
                Downloads
              </button>
            </div>
          </div>
        )}

        {/* top bar */}
        <div
          className={`pointer-events-none absolute inset-x-0 top-0 z-10 bg-gradient-to-b from-black/85 to-transparent px-4 pb-10 pt-3 transition-opacity duration-300 ${show ? "opacity-100" : "opacity-0"}`}
        >
          <div className="pointer-events-auto flex items-center gap-3">
            <Link href={p.backHref} aria-label="Back" className="focus-ring grid size-9 shrink-0 place-items-center rounded-full bg-white/10 text-white backdrop-blur transition hover:bg-primary">
              <ChevronLeft className="size-5" />
            </Link>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13.5px] font-bold text-white">{p.title}</p>
              <p className="truncate text-[10.5px] font-semibold text-white/55">{p.epLabel}</p>
            </div>
            <span className="hidden rounded-md border border-cyanic/50 bg-cyanic/15 px-2 py-0.5 text-[9.5px] font-extrabold tracking-widest text-cyanic sm:inline">
              HINDI AUDIO
            </span>
            <span className="rounded-md bg-white/10 px-2 py-0.5 text-[9.5px] font-extrabold tracking-widest text-white/80">
              1080p
            </span>
          </div>
        </div>

        {/* skip intro — floats above the control bar */}
        {showSkipIntro && (
          <button
            onClick={() => { skip(90 - time); toast("Intro skip! 🚀", { type: "info" }); }}
            className={`focus-ring absolute bottom-24 right-4 z-20 flex items-center gap-1.5 rounded-full border border-primary/70 bg-black/60 px-4 py-2 text-[11.5px] font-extrabold text-white backdrop-blur transition hover:bg-primary ${show ? "opacity-100" : "pointer-events-none opacity-0"}`}
          >
            <FastForward className="size-3.5" /> Skip Intro
          </button>
        )}

        {/* bottom controls */}
        <div
          className={`absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black/95 via-black/60 to-transparent px-4 pb-3 pt-12 transition-opacity duration-300 ${show ? "opacity-100" : "pointer-events-none opacity-0"}`}
        >
          {/* seek bar */}
          <div
            ref={seekRef}
            onPointerDown={(e) => {
              (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
              setDragging(true);
              seekTo(pctFromEvent(e));
            }}
            onPointerMove={(e) => {
              setHoverPct(pctFromEvent(e));
              if (dragging) seekTo(pctFromEvent(e));
            }}
            onPointerUp={() => setDragging(false)}
            onMouseLeave={() => setHoverPct(null)}
            className="group/seek relative mb-3 flex h-4 cursor-pointer items-center"
          >
            <div className="relative h-[5px] w-full overflow-hidden rounded-full bg-white/15 transition-all group-hover/seek:h-[8px]">
              <div className="absolute inset-y-0 left-0 bg-white/25" style={{ width: `${bufPct}%` }} />
              <div
                className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-primary-deep via-primary to-primary-soft"
                style={{ width: `${pct}%` }}
              />
            </div>
            <span
              className="absolute top-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white opacity-0 shadow-glow transition-opacity group-hover/seek:opacity-100"
              style={{ left: `${pct}%`, opacity: dragging ? 1 : undefined }}
            />
            {hoverPct !== null && dur > 0 && (
              <span
                className="pointer-events-none absolute -top-7 -translate-x-1/2 rounded-md bg-black/90 px-2 py-0.5 text-[10.5px] font-bold text-white"
                style={{ left: `${hoverPct * 100}%` }}
              >
                {fmtTime(hoverPct * dur)}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2.5">
            <button onClick={togglePlay} aria-label={playing ? "Pause" : "Play"} className="focus-ring grid size-9 place-items-center rounded-full text-white transition hover:bg-white/15">
              {playing ? <Pause className="size-5 fill-white" /> : <Play className="size-5 fill-white" />}
            </button>
            <button onClick={() => skip(-10)} aria-label="Back 10 seconds" className="focus-ring relative hidden size-9 place-items-center rounded-full text-white/85 transition hover:bg-white/15 min-[400px]:grid">
              <RotateCcw className="size-[18px]" />
              <span className="absolute text-[7px] font-black">10</span>
            </button>
            <button onClick={() => skip(10)} aria-label="Forward 10 seconds" className="focus-ring relative hidden size-9 place-items-center rounded-full text-white/85 transition hover:bg-white/15 min-[400px]:grid">
              <RotateCw className="size-[18px]" />
              <span className="absolute text-[7px] font-black">10</span>
            </button>

            <div className="flex items-center gap-1.5">
              <button onClick={toggleMute} aria-label="Mute" className="focus-ring grid size-9 place-items-center rounded-full text-white/85 transition hover:bg-white/15">
                <VolIcon className="size-[18px]" />
              </button>
              <input
                type="range" min={0} max={1} step={0.05} value={muted ? 0 : vol}
                onChange={(e) => setVolume(Number(e.target.value))}
                aria-label="Volume"
                className="vol hidden w-20 sm:block"
                style={{ background: `linear-gradient(to right, #f31260 ${(muted ? 0 : vol) * 100}%, rgba(255,255,255,0.25) ${(muted ? 0 : vol) * 100}%)` }}
              />
            </div>

            <span className="ml-1 text-[11px] font-bold tabular-nums text-white/75">
              {fmtTime(time)} <span className="hidden text-white/35 min-[440px]:inline">/ {fmtTime(dur)}</span>
            </span>

            <div className="flex-1" />

            <div className="relative">
              <button
                onClick={() => setRateOpen((o) => !o)}
                aria-label="Playback speed"
                className={`focus-ring flex h-9 items-center gap-1 rounded-full px-2.5 text-[11.5px] font-extrabold transition hover:bg-white/15 ${rate !== 1 ? "text-primary-soft" : "text-white/85"}`}
              >
                <Gauge className="size-4" /> {rate}x
              </button>
              {rateOpen && (
                <div className="absolute bottom-11 right-0 z-30 w-28 overflow-hidden rounded-xl border border-line bg-raised/95 py-1 shadow-card backdrop-blur-xl">
                  {RATES.map((r) => (
                    <button
                      key={r}
                      onClick={() => changeRate(r)}
                      className={`block w-full px-4 py-1.5 text-left text-[12px] font-bold transition hover:bg-white/10 ${r === rate ? "text-primary-soft" : "text-fg"}`}
                    >
                      {r}x {r === 1 && <span className="text-dim">(Normal)</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {p.hasNext && (
              <button onClick={p.onNext} aria-label="Next episode" className="focus-ring grid size-9 place-items-center rounded-full text-white/85 transition hover:bg-white/15">
                <SkipForward className="size-[18px]" />
              </button>
            )}
            <button onClick={p.onDownloads} aria-label="Downloads" className="focus-ring hidden size-9 place-items-center rounded-full text-white/85 transition hover:bg-white/15 sm:grid">
              <Download className="size-[18px]" />
            </button>
            {pipOk && (
              <button onClick={togglePip} aria-label="Picture in picture" className="focus-ring hidden size-9 place-items-center rounded-full text-white/85 transition hover:bg-white/15 md:grid">
                <PictureInPicture2 className="size-[18px]" />
              </button>
            )}
            <button onClick={toggleFs} aria-label="Fullscreen" className="focus-ring grid size-9 place-items-center rounded-full text-white/85 transition hover:bg-white/15">
              {fs ? <Minimize className="size-[18px]" /> : <Maximize className="size-[18px]" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}