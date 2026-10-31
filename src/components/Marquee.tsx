import { Flame } from "lucide-react";

const WORDS = [
  "HINDI DUB",
  "MULTI AUDIO",
  "1080P FHD",
  "狂気をストリーミング",
  "WATCH ONLINE",
  "FREE DOWNLOAD",
  "480P · 720P",
  "UNCUT",
];

function Track({ reverse = false }: { reverse?: boolean }) {
  const seq = [...WORDS, ...WORDS];
  return (
    <div className="overflow-hidden" style={reverse ? { transform: "rotate(1deg) scale(1.03)" } : undefined}>
      <div
        className="marquee-track items-center gap-10 py-4"
        style={{ "--marquee-speed": reverse ? "36s" : "26s", animationDirection: reverse ? "reverse" : "normal" } as React.CSSProperties}
      >
        {seq.map((w, i) => (
          <span key={i} className="flex items-center gap-10 whitespace-nowrap">
            <span className={`font-display text-2xl uppercase tracking-wide ${i % 2 ? "font-jp text-lg font-black" : ""}`}>
              {w}
            </span>
            <span className="grid h-6 w-6 place-items-center">
              <Flame className="h-4 w-4 fill-current" />
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}

/** double tilted marquee strip — signature from the reference */
export default function MarqueeBand() {
  return (
    <div className="relative -my-6 select-none py-6">
      <div className="-ml-[3%] w-[106%] -rotate-[1.4deg] bg-oni text-ink shadow-[0_20px_60px_-20px_rgba(255,42,42,0.5)]">
        <Track />
      </div>
      <div className="-ml-[3%] mt-[-6px] w-[106%] border-y border-line bg-coal text-paper/40">
        <Track reverse />
      </div>
    </div>
  );
}
